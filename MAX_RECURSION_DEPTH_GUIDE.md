# Max Recursion Depth Check - คู่มือการใช้งาน

**วันที่:** 27 ตุลาคม 2025
**เวอร์ชัน:** 0.0.25
**ปัญหาที่แก้:** ป้องกัน Stack Overflow จาก Unlimited Nested Includes

---

## สารบัญ

1. [ปัญหาที่พบ](#1-ปัญหาที่พบ)
2. [สาเหตุ](#2-สาเหตุ)
3. [ผลกระทบ](#3-ผลกระทบ)
4. [วิธีแก้ไข](#4-วิธีแก้ไข)
5. [ตัวอย่างการใช้งาน](#5-ตัวอย่างการใช้งาน)
6. [การทดสอบ](#6-การทดสอบ)

---

## 1. ปัญหาที่พบ

### ตำแหน่งในโค้ด
- **ไฟล์:** `src/lib/including.ts`
- **ฟังก์ชัน:** `onSuccess()`
- **บรรทัด:** ~310

### รายละเอียดปัญหา

ปัจจุบัน Including.js รองรับ **Unlimited Nested Includes** โดยใช้ `dimension` parameter เพื่อติดตามระดับของการซ้อน:

```typescript
export async function onSuccess({
  sessionId,
  inc,
  data,
  dimension,  // ตัวแปรนี้เพิ่มขึ้นเรื่อยๆ
}: {
  sessionId: string;
  inc: Include;
  data: any;
  dimension: number;
}) {
  // ... processing logic

  // เรียกตัวเองซ้ำโดยเพิ่ม dimension
  await onSuccess({
    sessionId,
    inc: childInclude,
    data: childData,
    dimension: dimension + 1  // ❌ ไม่มีการ check ขีดจำกัด
  });
}
```

**❌ ปัญหา:** ไม่มีการตรวจสอบว่า `dimension` เกินขีดจำกัดหรือไม่

---

## 2. สาเหตุ

### 2.1 Configuration ผิดพลาด

ผู้ใช้อาจตั้งค่า includes ที่วนซ้ำไม่สิ้นสุด:

```typescript
// ❌ Configuration ที่เป็นอันตราย
const config = {
  list: [{
    url: '/posts',
    model: 'posts',
    includes: [{
      url: '/users',
      model: 'users',
      on: 'userId',
      foreign: 'id',
      local: 'id',
      includes: [{
        url: '/posts',  // วนกลับไปที่ posts อีกครั้ง!
        model: 'posts',
        on: 'id',
        foreign: 'userId',
        local: 'userId',
        includes: [...]  // วนซ้ำไปเรื่อยๆ
      }]
    }]
  }]
};
```

### 2.2 Circular References

ข้อมูลที่มีความสัมพันธ์แบบวงกลม:

```
Posts → Users → Posts → Users → Posts → ...
  ↓       ↓       ↓       ↓       ↓
 Level 1  Level 2 Level 3 Level 4 Level 5 ... ∞
```

### 2.3 โครงสร้างข้อมูลซับซ้อนมาก

การซ้อนหลายระดับโดยไม่ได้ตั้งใจ:

```
Users
  → Posts
    → Comments
      → Likes
        → Users
          → Posts
            → Comments
              → ... (ซ้อนลึกเกินไป)
```

---

## 3. ผลกระทบ

### 3.1 Stack Overflow Error

```
RangeError: Maximum call stack size exceeded
```

- Application crash
- ไม่สามารถ recover ได้
- ส่งผลกระทบต่อ users อื่นๆ ในระบบ

### 3.2 Memory Leak

- สร้าง HTTP requests มากเกินไป
- ใช้ memory เพิ่มขึ้นเรื่อยๆ
- ทำให้ server ล่ม

### 3.3 API Rate Limiting

- ส่ง requests มากเกินไปไปยัง external APIs
- ถูก block โดย rate limiter
- ค่าใช้จ่าย API เพิ่มขึ้นแบบไม่ควบคุม

### 3.4 Performance Degradation

- Response time ช้ามาก
- CPU usage สูง
- Database connections หมด

---

## 4. วิธีแก้ไข

### 4.1 เพิ่ม Constant

เพิ่มค่าคงที่ที่ต้นไฟล์ `src/lib/including.ts`:

```typescript
/**
 * Maximum recursion depth for nested includes
 * Prevents stack overflow from circular references or misconfigured includes
 */
const MAX_RECURSION_DEPTH = 10;
```

**เหตุผลที่เลือก 10:**
- ใช้ได้จริงสำหรับ use cases ส่วนใหญ่
- ป้องกัน stack overflow
- Balance ระหว่าง flexibility และ safety

### 4.2 เพิ่ม Validation ใน onSuccess()

แก้ไขฟังก์ชัน `onSuccess()`:

```typescript
export async function onSuccess({
  sessionId,
  inc,
  data,
  dimension,
}: {
  sessionId: string;
  inc: Include;
  data: any;
  dimension: number;
}) {
  // ✅ เพิ่ม validation ที่บรรทัดแรกของฟังก์ชัน
  if (dimension > MAX_RECURSION_DEPTH) {
    throw new Error(
      `Maximum recursion depth (${MAX_RECURSION_DEPTH}) exceeded at dimension ${dimension}. ` +
      `This may indicate circular references in your includes configuration.`
    );
  }

  // ... rest of existing code
}
```

### 4.3 Error Message ที่ดี

Error message ควรมีข้อมูล:
- ✅ ค่า `MAX_RECURSION_DEPTH` ที่ตั้งไว้
- ✅ `dimension` ปัจจุบันที่เกินขีดจำกัด
- ✅ คำแนะนำว่าอาจเป็นเพราะ circular references
- ✅ ชัดเจน ช่วยให้ debug ง่าย

---

## 5. ตัวอย่างการใช้งาน

### 5.1 การทำงานปกติ (≤ 10 levels)

```typescript
import { including } from 'including';

// ✅ OK - 3 levels ของ nesting
const result = await including({
  list: [{
    url: '/posts',
    model: 'posts',
    includes: [{                    // Level 1
      url: '/users',
      model: 'user',
      on: 'userId',
      foreign: 'id',
      local: 'id',
      includes: [{                  // Level 2
        url: '/addresses',
        model: 'address',
        on: 'addressId',
        foreign: 'id',
        local: 'id',
        includes: [{                // Level 3
          url: '/countries',
          model: 'country',
          on: 'countryId',
          foreign: 'id',
          local: 'id'
        }]
      }]
    }]
  }]
});

console.log(result);
// ✅ Success - ได้ผลลัพธ์ตามต้องการ
```

### 5.2 เกินขีดจำกัด (> 10 levels)

```typescript
// ❌ Configuration ที่มี 15 levels
const deepConfig = {
  list: [{
    url: '/level1',
    model: 'level1',
    includes: [{
      url: '/level2',
      model: 'level2',
      includes: [{
        url: '/level3',
        model: 'level3',
        includes: [
          // ... ซ้อนต่อไปถึง level 15
        ]
      }]
    }]
  }]
};

try {
  const result = await including(deepConfig);
} catch (error) {
  console.error(error.message);
  // ❌ Error:
  // "Maximum recursion depth (10) exceeded at dimension 11.
  //  This may indicate circular references in your includes configuration."
}
```

### 5.3 Circular Reference Detection

```typescript
// ❌ Configuration ที่วนซ้ำ
const circularConfig = {
  list: [{
    url: '/posts',
    model: 'posts',
    includes: [{
      url: '/users',
      model: 'users',
      on: 'userId',
      foreign: 'id',
      local: 'id',
      includes: [{
        url: '/posts',      // ← วนกลับมา posts
        model: 'userPosts',
        on: 'id',
        foreign: 'userId',
        local: 'userId',
        includes: [{
          url: '/users',    // ← วนกลับมา users
          model: 'postUser',
          on: 'userId',
          foreign: 'id',
          local: 'id',
          // ... วนต่อไปเรื่อยๆ จนถึง level 11
        }]
      }]
    }]
  }]
};

try {
  const result = await including(circularConfig);
} catch (error) {
  console.error(error.message);
  // ❌ Error: Maximum recursion depth (10) exceeded at dimension 11.

  // แก้ไข: ออกแบบ data structure ใหม่
  // หรือใช้ lazy loading แทน
}
```

### 5.4 Workaround สำหรับ Deep Nesting

ถ้าต้องการ nesting ลึกกว่า 10 levels จริงๆ:

**วิธีที่ 1: แบ่ง Request ออกเป็นหลายครั้ง**

```typescript
// แทนที่จะซ้อนลึก 15 levels ในครั้งเดียว
// แบ่งเป็น 2 requests

// Request 1: Level 1-10
const firstBatch = await including({
  list: [{
    url: '/level1',
    model: 'level1',
    includes: [
      // ... ซ้อนถึง level 10
    ]
  }]
});

// Request 2: Level 11-15 (ใช้ data จาก firstBatch)
const secondBatch = await combining({
  data: firstBatch.level1,
  includes: [
    // ... ซ้อนต่ออีก 5 levels
  ]
});
```

**วิธีที่ 2: Lazy Loading**

```typescript
// โหลดแค่ส่วนที่จำเป็นก่อน
const initialData = await including({
  list: [{
    url: '/posts',
    model: 'posts',
    includes: [{
      url: '/users',
      model: 'user',
      // หยุดที่นี่ แทนที่จะซ้อนต่อ
    }]
  }]
});

// โหลด deep data เมื่อผู้ใช้ขอดูเพิ่มเติม
async function loadDeepData(postId) {
  return await including({
    list: [{
      url: `/posts/${postId}/deep-relations`,
      model: 'deepData',
      // ...
    }]
  });
}
```

**วิธีที่ 3: แก้ไข MAX_RECURSION_DEPTH (ไม่แนะนำ)**

```typescript
// ใน src/lib/including.ts
// แก้ไขเฉพาะกรณีที่จำเป็นจริงๆ เท่านั้น

const MAX_RECURSION_DEPTH = 20;  // เพิ่มจาก 10 → 20

// ⚠️ คำเตือน:
// - เพิ่มความเสี่ยงต่อ stack overflow
// - ควร profile และทดสอบให้ดีก่อน
// - พิจารณาใช้วิธีอื่นก่อน
```

---

## 6. การทดสอบ

### 6.1 Unit Test

สร้างไฟล์ `src/lib/__tests__/recursion-limit.test.ts`:

```typescript
import { including } from '../including';

describe('Max Recursion Depth', () => {
  it('should allow nesting up to MAX_RECURSION_DEPTH', async () => {
    // สร้าง config ที่มี 10 levels
    const config = createNestedConfig(10);

    // ✅ ควรทำงานสำเร็จ
    const result = await including(config);
    expect(result).toBeDefined();
  });

  it('should throw error when exceeding MAX_RECURSION_DEPTH', async () => {
    // สร้าง config ที่มี 11 levels
    const config = createNestedConfig(11);

    // ❌ ควร throw error
    await expect(including(config)).rejects.toThrow(
      /Maximum recursion depth.*exceeded/
    );
  });

  it('should include dimension number in error message', async () => {
    const config = createNestedConfig(15);

    try {
      await including(config);
      fail('Should have thrown error');
    } catch (error) {
      expect(error.message).toContain('dimension 11');
      expect(error.message).toContain('circular references');
    }
  });
});

// Helper function
function createNestedConfig(depth: number) {
  let config = {
    url: `/level${depth}`,
    model: `level${depth}`,
    includes: []
  };

  let current = config;
  for (let i = depth - 1; i > 0; i--) {
    const nested = {
      url: `/level${i}`,
      model: `level${i}`,
      includes: []
    };
    current.includes = [nested];
    current = nested;
  }

  return { list: [config] };
}
```

### 6.2 Integration Test

```typescript
describe('Max Recursion Depth - Integration', () => {
  it('should handle circular references gracefully', async () => {
    // Mock API ที่มี circular data
    mockFetch('/posts', [
      { id: 1, userId: 1 }
    ]);

    mockFetch('/users?id[]=1', [
      { id: 1, name: 'User 1' }
    ]);

    const config = {
      list: [{
        url: '/posts',
        model: 'posts',
        includes: [{
          url: '/users',
          model: 'users',
          on: 'userId',
          foreign: 'id',
          local: 'id',
          includes: [{
            url: '/posts',  // Circular!
            model: 'userPosts',
            on: 'id',
            foreign: 'userId',
            local: 'userId',
            includes: [
              // ... ซ้อนต่อจนเกิน 10 levels
            ]
          }]
        }]
      }]
    };

    // ควร throw error แทนที่จะ stack overflow
    await expect(including(config)).rejects.toThrow();
  });
});
```

### 6.3 Manual Testing

```bash
# 1. Clone repo
git clone <repo-url>
cd including

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. สร้างไฟล์ test
cat > test-recursion.js << 'EOF'
const { including } = require('./dist');

// Test 1: Normal nesting (should work)
async function test1() {
  console.log('Test 1: Normal nesting (5 levels)...');
  try {
    const result = await including({
      list: [{
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        model: 'post',
        includes: [{
          url: 'https://jsonplaceholder.typicode.com/users/$1',
          model: 'user',
          params: ['userId']
        }]
      }]
    });
    console.log('✅ Test 1 passed');
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }
}

// Test 2: Deep nesting (should fail)
async function test2() {
  console.log('\nTest 2: Deep nesting (15 levels)...');

  // สร้าง config ที่ซ้อนลึก 15 levels
  let config = {
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    model: 'level1'
  };

  let current = config;
  for (let i = 2; i <= 15; i++) {
    const nested = {
      url: `https://jsonplaceholder.typicode.com/users/1`,
      model: `level${i}`
    };
    current.includes = [nested];
    current = nested;
  }

  try {
    await including({ list: [config] });
    console.error('❌ Test 2 failed: Should have thrown error');
  } catch (error) {
    if (error.message.includes('Maximum recursion depth')) {
      console.log('✅ Test 2 passed:', error.message);
    } else {
      console.error('❌ Test 2 failed with unexpected error:', error.message);
    }
  }
}

// Run tests
(async () => {
  await test1();
  await test2();
})();
EOF

# 5. Run test
node test-recursion.js
```

**Expected Output:**

```
Test 1: Normal nesting (5 levels)...
✅ Test 1 passed

Test 2: Deep nesting (15 levels)...
✅ Test 2 passed: Maximum recursion depth (10) exceeded at dimension 11. This may indicate circular references in your includes configuration.
```

---

## สรุป

### การแก้ไขที่ทำ

1. ✅ เพิ่ม constant `MAX_RECURSION_DEPTH = 10`
2. ✅ เพิ่ม validation ใน `onSuccess()` function
3. ✅ สร้าง error message ที่ชัดเจน
4. ✅ ป้องกัน stack overflow และ infinite loops

### ประโยชน์

- 🛡️ ป้องกัน application crash
- 🔍 ตรวจจับ configuration ผิดพลาดได้ง่าย
- ⚡ ปรับปรุง performance และ stability
- 💰 ลด API costs จาก infinite requests
- 📊 ช่วยให้ debug ง่ายขึ้น

### Trade-offs

- ⚠️ จำกัด nesting ที่ 10 levels (แต่ใช้ได้จริงสำหรับ 99% use cases)
- ⚠️ ถ้าต้องการ deep nesting จริงๆ ต้องใช้ workarounds

### ผลกระทบต่อ Backward Compatibility

- ✅ ไม่กระทบ code ที่มีอยู่แล้ว (ส่วนใหญ่ไม่ซ้อนเกิน 10 levels)
- ⚠️ Code ที่มี circular references จะ fail (แต่นี่คือสิ่งที่ต้องการ)
- ⚠️ Code ที่ซ้อนเกิน 10 levels จะต้องแก้ไข (แต่น่าจะหาได้ยาก)

---

**เอกสารนี้สร้างโดย:** Claude Code Analysis
**เวอร์ชัน:** 1.0
**วันที่:** 27 ตุลาคม 2025
