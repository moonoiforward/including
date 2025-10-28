# Implementation Guide: Optimizing Production Endpoints

This guide provides step-by-step instructions for optimizing the `data-credit-withdraws.controller.ts` production endpoints.

## Table of Contents
1. [Quick Wins (Immediate Actions)](#1-quick-wins-immediate-actions)
2. [Setting Up Infrastructure](#2-setting-up-infrastructure)
3. [Migrating GET /:id Endpoint](#3-migrating-get-id-endpoint)
4. [Adding Monitoring](#4-adding-monitoring)
5. [Rollout Strategy](#5-rollout-strategy)

---

## 1. Quick Wins (Immediate Actions)

### Action 1.1: Remove Duplicate BookBanks Includes

**Problem:** BookBanks include appears 4 times identically in GET /:id endpoint.

**Location:** Lines 635-656, 815-836, 995-1016, 1175-1196

**Fix:** Keep only the first occurrence, remove the other 3.

```typescript
// BEFORE: 4 separate identical includes scattered throughout the code

// AFTER: Single include at the appropriate level
{
  url: 'CMS_SERVICE_URL/sugarcane-farmers',
  model: 'includeSugarcaneFarmers',
  includes: [
    {
      url: 'CMS_SERVICE_URL/customers',
      model: 'includeCustomer',
      includes: [
        {
          // KEEP ONLY THIS ONE
          url: 'CMS_SERVICE_URL/data-book-banks',
          model: 'includeBookBanks',
          query: { filter: { isActive: 1 } },
          on: 'customerCode',
          method: 'GET',
          at: 'data.list',
          each: true,
          local: 'customerCode',
          foreign: 'filter[customerCode]',
          includes: [
            {
              url: 'MASTER_SERVICE_URL/banks/by/bankCode/$1',
              model: 'includeBank',
              params: ['bankCode'],
              method: 'GET',
              at: 'data'
            }
          ]
        }
        // DELETE the other 3 duplicate includes
      ]
    }
  ]
}
```

**Expected Impact:**
- Reduce requests by ~30-50%
- Faster response time: 10-30s → 7-20s
- No code changes required, just configuration cleanup

---

### Action 1.2: Add Request Deduplication

**Problem:** Including.js may fetch same data multiple times.

**Fix:** Add `duplicate: false` to frequently accessed includes.

```typescript
// Add to all Bank fetches
{
  url: 'MASTER_SERVICE_URL/banks/by/bankCode/$1',
  model: 'includeBank',
  params: ['bankCode'],
  method: 'GET',
  at: 'data',
  duplicate: false  // ← ADD THIS
}

// Add to all Customer fetches
{
  url: 'CMS_SERVICE_URL/customers',
  model: 'includeCustomer',
  on: 'customerCode',
  method: 'GET',
  at: 'data.list',
  local: 'customerCode',
  foreign: 'filter[customerCode]',
  duplicate: false  // ← ADD THIS
}

// Add to all common lookups (villages, districts, provinces, zones)
{
  url: 'MASTER_SERVICE_URL/villages/by/villageCode/$1',
  model: 'includeVillage',
  params: ['villageCode'],
  method: 'GET',
  at: 'data',
  duplicate: false  // ← ADD THIS
}
```

**Expected Impact:**
- Reduce duplicate requests
- 5-10% performance improvement

---

### Action 1.3: Add Basic Monitoring

**Location:** Add to each endpoint method

```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  const startTime = Date.now();
  let requestCount = 0;

  // Intercept fetch to count requests
  const originalFetch = global.fetch;
  global.fetch = ((...args) => {
    requestCount++;
    return originalFetch(...args);
  }) as any;

  try {
    const result = await including({
      // ... existing config
    });

    const duration = Date.now() - startTime;

    // Log performance metrics
    this.logger.log({
      endpoint: 'GET /:id',
      withdrawalId: id,
      duration,
      requestCount,
      timestamp: new Date().toISOString()
    });

    // Alert if slow
    if (duration > 15000) {
      this.logger.warn(`Slow request detected: ${duration}ms, ${requestCount} requests`);
    }

    return result.data_credit_withdraws;

  } finally {
    // Restore original fetch
    global.fetch = originalFetch;
  }
}
```

**Expected Output:**
```json
{
  "endpoint": "GET /:id",
  "withdrawalId": "123",
  "duration": 12450,
  "requestCount": 187,
  "timestamp": "2025-01-15T10:30:45.123Z"
}
```

---

## 2. Setting Up Infrastructure

### Step 2.1: Install Dependencies

```bash
npm install dataloader
npm install @nestjs/cache-manager cache-manager
npm install -D @types/cache-manager
```

### Step 2.2: Configure Cache Module

**File:** `app.module.ts`

```typescript
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // 5 minutes default
      max: 1000, // Maximum number of items in cache
      isGlobal: true
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

### Step 2.3: Create Data Loader Service

**File:** `src/modules/bff/services/data-loaders.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DataLoadersService {
  private bankLoader: DataLoader<string, any>;
  private customerLoader: DataLoader<string, any>;
  private farmerLoader: DataLoader<string, any>;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.initializeLoaders();
  }

  private initializeLoaders() {
    // Bank Loader
    this.bankLoader = new DataLoader(
      async (bankCodes: readonly string[]) => {
        const banks = await this.fetchBanksBatch([...bankCodes]);
        const banksMap = new Map(banks.map(b => [b.bankCode, b]));
        return bankCodes.map(code => banksMap.get(code) || null);
      },
      {
        cache: true,
        maxBatchSize: 100,
        batchScheduleFn: (callback) => setTimeout(callback, 10)
      }
    );

    // Customer Loader
    this.customerLoader = new DataLoader(
      async (customerCodes: readonly string[]) => {
        const customers = await this.fetchCustomersBatch([...customerCodes]);
        const customersMap = new Map<string, any[]>();
        customers.forEach(c => {
          if (!customersMap.has(c.customerCode)) {
            customersMap.set(c.customerCode, []);
          }
          customersMap.get(c.customerCode).push(c);
        });
        return customerCodes.map(code => customersMap.get(code) || []);
      },
      { cache: true, maxBatchSize: 100 }
    );

    // Farmer Loader
    this.farmerLoader = new DataLoader(
      async (quotaNumbers: readonly string[]) => {
        const farmers = await this.fetchFarmersBatch([...quotaNumbers]);
        const farmersMap = new Map<string, any[]>();
        farmers.forEach(f => {
          if (!farmersMap.has(f.quotaNumber)) {
            farmersMap.set(f.quotaNumber, []);
          }
          farmersMap.get(f.quotaNumber).push(f);
        });
        return quotaNumbers.map(qn => farmersMap.get(qn) || []);
      },
      { cache: true, maxBatchSize: 100 }
    );
  }

  // Public methods
  async loadBank(bankCode: string): Promise<any> {
    return this.bankLoader.load(bankCode);
  }

  async loadCustomers(customerCode: string): Promise<any[]> {
    return this.customerLoader.load(customerCode);
  }

  async loadFarmers(quotaNumber: string): Promise<any[]> {
    return this.farmerLoader.load(quotaNumber);
  }

  // Batch fetch methods
  private async fetchBanksBatch(bankCodes: string[]): Promise<any[]> {
    if (bankCodes.length === 0) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.configService.get('MASTER_SERVICE_URL')}/banks/batch`,
          { bankCodes }
        )
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching banks batch:', error);
      return [];
    }
  }

  private async fetchCustomersBatch(customerCodes: string[]): Promise<any[]> {
    if (customerCodes.length === 0) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get('CMS_SERVICE_URL')}/customers`,
          {
            params: {
              'filter[customerCode]': customerCodes.join(',')
            }
          }
        )
      );
      return response.data.data?.list || [];
    } catch (error) {
      console.error('Error fetching customers batch:', error);
      return [];
    }
  }

  private async fetchFarmersBatch(quotaNumbers: string[]): Promise<any[]> {
    if (quotaNumbers.length === 0) return [];

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.configService.get('CMS_SERVICE_URL')}/sugarcane-farmers`,
          {
            params: {
              'filter[quotaNumber]': quotaNumbers.join(',')
            }
          }
        )
      );
      return response.data.data?.list || [];
    } catch (error) {
      console.error('Error fetching farmers batch:', error);
      return [];
    }
  }

  // Clear loaders (call on each request)
  clearAll() {
    this.bankLoader.clearAll();
    this.customerLoader.clearAll();
    this.farmerLoader.clearAll();
  }
}
```

### Step 2.4: Create Optimized Service

**File:** `src/modules/bff/services/data-credit-withdraws-optimized.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { DataLoadersService } from './data-loaders.service';

@Injectable()
export class DataCreditWithdrawsOptimizedService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dataLoaders: DataLoadersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async findOne(id: string): Promise<any> {
    const startTime = Date.now();

    // Clear DataLoaders for this request
    this.dataLoaders.clearAll();

    try {
      // Step 1: Fetch main withdrawal
      const withdrawal = await this.fetchWithdrawal(id);
      if (!withdrawal) {
        throw new NotFoundException(`Withdrawal ${id} not found`);
      }

      // Step 2: Parallel fetch all top-level data
      const [
        farmers,
        quotas,
        withdrawItems,
        villages,
        // ... add all 29 top-level includes
      ] = await Promise.all([
        this.fetchFarmers(withdrawal.quotaNumber),
        this.fetchQuotas(withdrawal.quotaNumber),
        this.fetchWithdrawItems(withdrawal.id),
        this.fetchVillage(withdrawal.villageCode),
        // ... add all 29 top-level fetches
      ]);

      // Step 3: Extract all customer codes
      const customerCodes = this.extractUnique(farmers, 'customerCode');

      // Step 4: Batch fetch customers and book banks
      const [customers, bookBanks] = await Promise.all([
        this.fetchCustomersBatch(customerCodes),
        this.fetchBookBanksBatch(customerCodes)
      ]);

      // Step 5: Extract bank codes and fetch
      const bankCodes = this.extractUnique(bookBanks, 'bankCode');
      const banks = await this.fetchBanksBatch(bankCodes);

      // Step 6: Join all data
      this.joinData(withdrawal, {
        farmers,
        customers,
        bookBanks,
        banks,
        quotas,
        withdrawItems,
        villages,
        // ... pass all data
      });

      const duration = Date.now() - startTime;
      console.log(`Optimized findOne(${id}): ${duration}ms`);

      return withdrawal;

    } catch (error) {
      console.error(`Error in findOne(${id}):`, error);
      throw error;
    }
  }

  // Helper methods
  private async fetchWithdrawal(id: string): Promise<any> {
    const cacheKey = `withdrawal:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const response = await firstValueFrom(
      this.httpService.get(
        `${this.configService.get('CMS_SERVICE_URL')}/data-credit-withdraws/${id}`
      )
    );

    const withdrawal = response.data.data;
    await this.cacheManager.set(cacheKey, withdrawal, 60); // Cache 1 minute
    return withdrawal;
  }

  private async fetchFarmers(quotaNumber: string): Promise<any[]> {
    if (!quotaNumber) return [];
    return this.dataLoaders.loadFarmers(quotaNumber);
  }

  private async fetchCustomersBatch(customerCodes: string[]): Promise<any[]> {
    if (customerCodes.length === 0) return [];

    const customers = await Promise.all(
      customerCodes.map(code => this.dataLoaders.loadCustomers(code))
    );

    return customers.flat();
  }

  private async fetchBookBanksBatch(customerCodes: string[]): Promise<any[]> {
    if (customerCodes.length === 0) return [];

    const cacheKey = `bookbanks:${customerCodes.sort().join(',')}`;
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    const response = await firstValueFrom(
      this.httpService.get(
        `${this.configService.get('CMS_SERVICE_URL')}/data-book-banks`,
        {
          params: {
            'filter[customerCode]': customerCodes.join(','),
            'filter[isActive]': 1
          }
        }
      )
    );

    const bookBanks = response.data.data?.list || [];
    await this.cacheManager.set(cacheKey, bookBanks, 300);
    return bookBanks;
  }

  private async fetchBanksBatch(bankCodes: string[]): Promise<any[]> {
    if (bankCodes.length === 0) return [];

    const banks = await Promise.all(
      bankCodes.map(code => this.dataLoaders.loadBank(code))
    );

    return banks.filter(Boolean);
  }

  private joinData(withdrawal: any, data: any): void {
    const {
      farmers,
      customers,
      bookBanks,
      banks,
      quotas,
      withdrawItems,
      villages
    } = data;

    // Join farmers
    withdrawal.includeSugarcaneFarmers = farmers;

    // Create lookup maps
    const customersByCode = this.groupBy(customers, 'customerCode');
    const bookBanksByCustomer = this.groupBy(bookBanks, 'customerCode');
    const banksByCode = new Map(banks.map(b => [b.bankCode, b]));

    // Join customers to farmers
    farmers.forEach(farmer => {
      const farmerCustomers = customersByCode.get(farmer.customerCode) || [];

      // Join book banks to customers
      farmerCustomers.forEach(customer => {
        const customerBookBanks = bookBanksByCustomer.get(customer.customerCode) || [];

        // Join banks to book banks
        customerBookBanks.forEach(bookBank => {
          bookBank.includeBank = banksByCode.get(bookBank.bankCode) || null;
        });

        customer.includeBookBanks = customerBookBanks;
      });

      farmer.includeCustomer = farmerCustomers;
    });

    // Join other top-level data
    withdrawal.includeQuotas = quotas;
    withdrawal.includeWithdrawItems = withdrawItems;
    withdrawal.includeVillage = villages;
    // ... join all other top-level data
  }

  private extractUnique(array: any[], field: string): string[] {
    return [...new Set(
      array
        .map(item => item?.[field])
        .filter(Boolean)
    )];
  }

  private groupBy<T>(array: T[], key: string): Map<any, T[]> {
    const map = new Map();
    array.forEach(item => {
      const value = item[key];
      if (!map.has(value)) {
        map.set(value, []);
      }
      map.get(value).push(item);
    });
    return map;
  }
}
```

---

## 3. Migrating GET /:id Endpoint

### Step 3.1: Add Feature Flag

**File:** `data-credit-withdraws.controller.ts`

```typescript
import { DataCreditWithdrawsOptimizedService } from './services/data-credit-withdraws-optimized.service';

@Controller('data-credit-withdraws')
export class DataCreditWithdrawsController {
  constructor(
    private readonly optimizedService: DataCreditWithdrawsOptimizedService,
    private readonly configService: ConfigService
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Feature flag - controlled via environment variable
    const useOptimized = this.configService.get('USE_OPTIMIZED_ENDPOINT', 'false') === 'true';

    if (useOptimized) {
      return this.optimizedService.findOne(id);
    }

    // Original Including.js implementation
    return this.findOneOriginal(id);
  }

  private async findOneOriginal(id: string) {
    // Original code using Including.js
    const result = await including({
      // ... existing config (lines 531-1381)
    });

    return result.data_credit_withdraws;
  }
}
```

### Step 3.2: Environment Configuration

**File:** `.env`

```bash
# Feature flags
USE_OPTIMIZED_ENDPOINT=false  # Start with false

# Cache configuration
CACHE_TTL=300  # 5 minutes
CACHE_MAX=1000

# Performance monitoring
LOG_SLOW_REQUESTS=true
SLOW_REQUEST_THRESHOLD=5000  # 5 seconds
```

### Step 3.3: Gradual Rollout Configuration

```typescript
// Advanced feature flag with percentage rollout
@Get(':id')
async findOne(@Param('id') id: string, @Headers() headers: any) {
  const rolloutPercentage = parseInt(
    this.configService.get('OPTIMIZED_ROLLOUT_PERCENTAGE', '0')
  );

  // Use header override for testing
  if (headers['x-use-optimized'] === 'true') {
    return this.optimizedService.findOne(id);
  }

  // Percentage-based rollout
  const useOptimized = this.shouldUseOptimized(id, rolloutPercentage);

  if (useOptimized) {
    try {
      return await this.optimizedService.findOne(id);
    } catch (error) {
      // Fallback to original if optimized fails
      this.logger.error('Optimized endpoint failed, falling back', error);
      return this.findOneOriginal(id);
    }
  }

  return this.findOneOriginal(id);
}

private shouldUseOptimized(id: string, percentage: number): boolean {
  if (percentage === 0) return false;
  if (percentage === 100) return true;

  // Consistent hashing based on ID
  const hash = id.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  return (hash % 100) < percentage;
}
```

---

## 4. Adding Monitoring

### Step 4.1: Performance Interceptor

**File:** `src/common/interceptors/performance.interceptor.ts`

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const startTime = Date.now();
    let requestCount = 0;

    // Count fetch requests
    const originalFetch = global.fetch;
    global.fetch = ((...args) => {
      requestCount++;
      return originalFetch(...args);
    }) as any;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;

          this.logger.log({
            method: req.method,
            url: req.url,
            duration,
            requestCount,
            timestamp: new Date().toISOString()
          });

          // Alert on slow requests
          if (duration > 5000) {
            this.logger.warn(
              `Slow request: ${req.method} ${req.url} - ${duration}ms with ${requestCount} requests`
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error({
            method: req.method,
            url: req.url,
            duration,
            requestCount,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        },
        finalize: () => {
          // Restore original fetch
          global.fetch = originalFetch;
        }
      })
    );
  }
}
```

**Apply to controller:**

```typescript
@Controller('data-credit-withdraws')
@UseInterceptors(PerformanceInterceptor)
export class DataCreditWithdrawsController {
  // ... controller code
}
```

### Step 4.2: Comparison Logging

```typescript
@Get(':id')
async findOne(@Param('id') id: string, @Headers() headers: any) {
  // Run both implementations and compare
  if (headers['x-compare-performance'] === 'true') {
    return this.compareImplementations(id);
  }

  // Normal flow...
}

private async compareImplementations(id: string) {
  // Run original
  const startOriginal = Date.now();
  let originalRequestCount = 0;

  const originalFetch = global.fetch;
  global.fetch = ((...args) => {
    originalRequestCount++;
    return originalFetch(...args);
  }) as any;

  const originalResult = await this.findOneOriginal(id);
  const originalDuration = Date.now() - startOriginal;

  global.fetch = originalFetch;

  // Run optimized
  const startOptimized = Date.now();
  let optimizedRequestCount = 0;

  global.fetch = ((...args) => {
    optimizedRequestCount++;
    return originalFetch(...args);
  }) as any;

  const optimizedResult = await this.optimizedService.findOne(id);
  const optimizedDuration = Date.now() - startOptimized;

  global.fetch = originalFetch;

  // Log comparison
  this.logger.log({
    withdrawalId: id,
    original: {
      duration: originalDuration,
      requestCount: originalRequestCount
    },
    optimized: {
      duration: optimizedDuration,
      requestCount: optimizedRequestCount
    },
    improvement: {
      durationPercent: ((originalDuration - optimizedDuration) / originalDuration * 100).toFixed(2) + '%',
      requestsReduced: originalRequestCount - optimizedRequestCount
    }
  });

  return optimizedResult;
}
```

---

## 5. Rollout Strategy

### Phase 1: Testing (Week 1)

```bash
# .env
USE_OPTIMIZED_ENDPOINT=false
OPTIMIZED_ROLLOUT_PERCENTAGE=0
```

**Actions:**
1. Deploy code with feature flag OFF
2. Test manually with header: `x-use-optimized: true`
3. Compare performance with: `x-compare-performance: true`
4. Verify data integrity (compare responses)
5. Load test in staging

**Success Criteria:**
- Optimized endpoint returns identical data
- Response time < 2 seconds
- No errors in logs

---

### Phase 2: Canary Rollout (Week 2)

```bash
# .env
OPTIMIZED_ROLLOUT_PERCENTAGE=1  # 1% of traffic
```

**Actions:**
1. Enable for 1% of requests
2. Monitor error rates
3. Compare performance metrics
4. Check for any unexpected errors

**Success Criteria:**
- Error rate < 0.1%
- Performance improvement visible
- No data integrity issues

---

### Phase 3: Gradual Increase (Week 3-4)

```bash
# Week 3, Day 1
OPTIMIZED_ROLLOUT_PERCENTAGE=10

# Week 3, Day 3
OPTIMIZED_ROLLOUT_PERCENTAGE=25

# Week 3, Day 5
OPTIMIZED_ROLLOUT_PERCENTAGE=50

# Week 4, Day 2
OPTIMIZED_ROLLOUT_PERCENTAGE=100
```

**Actions:**
- Increase percentage every 2-3 days
- Monitor metrics at each step
- Keep fallback ready

**Rollback Plan:**
```bash
# If any issues occur
OPTIMIZED_ROLLOUT_PERCENTAGE=0  # Immediate rollback
```

---

### Phase 4: Full Migration (Week 5)

```bash
# .env
USE_OPTIMIZED_ENDPOINT=true
```

**Actions:**
1. Remove feature flag code
2. Delete original Including.js implementation
3. Remove Including.js dependency (if unused elsewhere)
4. Update documentation

---

## 6. Monitoring Dashboard

### Key Metrics to Track

```typescript
// Example metrics structure
interface PerformanceMetrics {
  endpoint: string;
  implementation: 'original' | 'optimized';

  // Response time
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;

  // Requests
  avgRequestCount: number;
  maxRequestCount: number;

  // Errors
  errorRate: number;
  errorTypes: { [key: string]: number };

  // Success
  successRate: number;

  // Time period
  timestamp: Date;
  period: '1h' | '24h' | '7d';
}
```

### Grafana Dashboard Query Examples

```sql
-- Average response time comparison
SELECT
  implementation,
  AVG(duration) as avg_duration,
  PERCENTILE(duration, 95) as p95_duration
FROM performance_logs
WHERE endpoint = 'GET /:id'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY implementation;

-- Request count comparison
SELECT
  implementation,
  AVG(request_count) as avg_requests
FROM performance_logs
WHERE endpoint = 'GET /:id'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY implementation;

-- Error rate
SELECT
  implementation,
  COUNT(CASE WHEN error IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as error_rate
FROM performance_logs
WHERE endpoint = 'GET /:id'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY implementation;
```

---

## 7. Testing Checklist

### Unit Tests

- [ ] Test each batch fetch method independently
- [ ] Test DataLoader caching behavior
- [ ] Test data joining logic
- [ ] Test error handling for each fetch
- [ ] Test with empty/null data

### Integration Tests

- [ ] Test full endpoint with real (mocked) data
- [ ] Test with various data sizes (1, 10, 100 items)
- [ ] Test with missing relationships
- [ ] Test with null/undefined values
- [ ] Test concurrent requests

### Load Tests

```bash
# Using Artillery
artillery quick --count 100 --num 10 https://api.example.com/data-credit-withdraws/123
```

**Load Test Targets:**
- 100 requests/second sustained
- P95 response time < 2 seconds
- Error rate < 0.1%
- CPU usage < 70%
- Memory usage stable

### Data Integrity Tests

```typescript
// Compare original vs optimized response
it('should return identical data', async () => {
  const originalResult = await controller.findOneOriginal('123');
  const optimizedResult = await optimizedService.findOne('123');

  expect(normalizeData(optimizedResult)).toEqual(normalizeData(originalResult));
});

function normalizeData(data: any): any {
  // Remove any timestamps, sort arrays, etc.
  return JSON.parse(JSON.stringify(data, Object.keys(data).sort()));
}
```

---

## 8. Troubleshooting

### Issue 1: Optimized endpoint returns different data

**Diagnosis:**
```typescript
const diff = require('deep-diff');
const differences = diff(originalResult, optimizedResult);
console.log('Data differences:', differences);
```

**Common causes:**
- Missing data join
- Incorrect grouping logic
- Different null handling

---

### Issue 2: Performance not improving

**Diagnosis:**
```typescript
// Add detailed timing logs
console.time('fetch-withdrawal');
const withdrawal = await this.fetchWithdrawal(id);
console.timeEnd('fetch-withdrawal');

console.time('fetch-farmers');
const farmers = await this.fetchFarmers(withdrawal.quotaNumber);
console.timeEnd('fetch-farmers');

// ... etc
```

**Common causes:**
- Batching not working (still N+1)
- DataLoader not batching (check batchScheduleFn)
- Cache not being used
- Network latency

---

### Issue 3: Memory leaks

**Diagnosis:**
```typescript
// Monitor DataLoader cache size
setInterval(() => {
  console.log('Bank loader size:', this.dataLoaders.bankLoader['_cacheMap'].size);
}, 10000);
```

**Fix:**
```typescript
// Clear loaders after each request
afterEach(() => {
  this.dataLoaders.clearAll();
});
```

---

## 9. Success Metrics

### Target Improvements

| Metric | Before (Including.js) | After (Optimized) | Improvement |
|--------|----------------------|-------------------|-------------|
| Response Time (avg) | 12s | 1.5s | 87% |
| Response Time (P95) | 25s | 3s | 88% |
| Request Count | 150 | 8 | 95% |
| Error Rate | 2% | 0.5% | 75% |
| Throughput | 8 req/s | 66 req/s | 725% |

### ROI Calculation

**Development Cost:**
- Setup infrastructure: 8 hours
- Migrate endpoint: 16 hours
- Testing: 8 hours
- **Total: 32 hours**

**Performance Gain:**
- 10.5 seconds saved per request
- 1000 requests/day = 10,500 seconds saved/day
- **2.9 hours saved per day in response time**

**Payback Period:** ~11 days of production use

---

## Conclusion

This implementation guide provides a step-by-step approach to migrating from Including.js to an optimized manual implementation. The gradual rollout strategy minimizes risk while the comprehensive monitoring ensures any issues are caught early.

**Next Steps:**
1. Start with Quick Wins (remove duplicates, add monitoring)
2. Set up infrastructure (DataLoader, caching)
3. Implement optimized service
4. Deploy with feature flag
5. Gradual rollout following the phases
6. Monitor and optimize further

The expected result is a 87-95% performance improvement with better error handling and easier debugging.
