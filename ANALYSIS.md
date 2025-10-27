# การวิเคราะห์โครงสร้างโปรเจ็ค Including.js

**วันที่วิเคราะห์:** 27 ตุลาคม 2025
**เวอร์ชัน:** 0.0.25
**ประเภท:** TypeScript/Node.js HTTP Client Library

---

## สารบัญ

1. [ภาพรวมโปรเจ็ค](#1-ภาพรวมโปรเจ็ค)
2. [โครงสร้างสถาปัตยกรรม](#2-โครงสร้างสถาปัตยกรรม)
3. [โครงสร้างโค้ด](#3-โครงสร้างโค้ด)
4. [รายละเอียดการทำงาน](#4-รายละเอียดการทำงาน)
5. [ข้อดี](#5-ข้อดี)
6. [ข้อเสีย](#6-ข้อเสีย)
7. [คำแนะนำการแก้ไข](#7-คำแนะนำการแก้ไข)
8. [ตัวอย่างการใช้งาน](#8-ตัวอย่างการใช้งาน)
9. [สรุปและคะแนน](#9-สรุปและคะแนน)

---

## 1. ภาพรวมโปรเจ็ค

### วัตถุประสงค์

**Including.js** เป็น HTTP client library ที่ออกแบบมาเพื่อแก้ปัญหาที่พบบ่อยในการพัฒนา Backend: การดึงข้อมูลจากหลาย API endpoints และรวมข้อมูลตามความสัมพันธ์ (relationships) โดยอัตโนมัติ

แทนที่จะต้องเขียน:
```javascript
const posts = await fetch('/posts').then(r => r.json());
const userIds = posts.map(p => p.userId);
const users = await fetch(`/users?id[]=${userIds.join(',')}`).then(r => r.json());
for (let post of posts) {
  post.user = users.find(u => u.id === post.userId);
}
```

ใช้แค่:
```typescript
including({
  list: [{
    url: '/posts',
    method: 'GET',
    model: 'posts',
    includes: [{
      url: '/users',
      method: 'GET',
      model: 'user',
      on: 'userId',
      foreign: 'id',
      local: 'id'
    }]
  }]
})
```

### คุณสมบัติหลัก

1. **Multiple Endpoint Requests** - ประมวลผลหลาย HTTP requests แบบ parallel
2. **Unlimited Nested Includes** - รองรับการซ้อนข้อมูลไม่จำกัดระดับ
3. **Auto Data Joining** - รวมข้อมูลอัตโนมัติโดยไม่ต้องเขียน loop
4. **Branches Feature** - สร้าง main data list จาก belonging data
5. **Session Management** - แชร์ค่าระหว่าง requests
6. **Field Selection** - เลือก/ไม่เลือก fields ที่ต้องการ
7. **Flexible Configuration** - รองรับ callbacks, custom builders

---

## 2. โครงสร้างสถาปัตยกรรม

### Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│         PUBLIC API LAYER                            │
│  - including() - Main entry point                   │
│  - combining() - Data enrichment entry point        │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│      CORE PROCESSING LAYER                          │
│  - request() - Main HTTP requests                   │
│  - requestForChildren() - Child HTTP requests       │
│  - onSuccess() - Post-response processing           │
│  - childrening() - Nested include processing        │
│  - selectsAndExcludes() - Field filtering           │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│      UTILITY LAYER                                  │
│  - HttpClient - Fetch wrapper                       │
│  - Mapping - URL/query/identity building            │
│  - MyObject - Flatten/unflatten operations          │
│  - MyString - ID generation                         │
│  - Session - State management                       │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
1. including() → Initialize session
2. request() → Execute main HTTP request
3. onSuccess() → Process response
4. childrening() → Process nested includes
5. requestForChildren() → Execute child requests
6. mapDataFromList() → Join data
7. unflatten() → Rebuild structure
8. Return results
```

---

## 3. โครงสร้างโค้ด

### File Structure

```
src/
├── index.ts              # Main entry point (exports public API)
├── dev.ts                # Development/test file
├── lib/
│   ├── including.ts      # Main including logic (504 lines)
│   ├── combining.ts      # Data enrichment logic (34 lines)
│   ├── http-client.ts    # Fetch wrapper (59 lines)
│   ├── mapping.ts        # URL/query/identity builders (249 lines)
│   ├── my-object.ts      # Object utilities (46 lines)
│   ├── my-string.ts      # String utilities (7 lines)
│   ├── random.ts         # Random string generation (39 lines)
│   └── regex.ts          # Regex helpers (7 lines)
└── models/
    ├── Include.ts        # Configuration model (363 lines)
    ├── Identity.ts       # Identity interface (6 lines)
    ├── Session.ts        # Session management (67 lines)
    ├── Action.ts         # Action model (34 lines)
    ├── ObjectJson.ts     # Type alias (2 lines)
    └── index.ts          # Model exports (4 lines)
```

**รวมโค้ดทั้งหมด:** ~1,500 บรรทัด TypeScript

### Core Components

| Component | ไฟล์ | บทบาท |
|-----------|------|--------|
| **including()** | lib/including.ts | Entry point หลัก, จัดการ parallel requests |
| **combining()** | lib/combining.ts | Enrich data ที่มีอยู่แล้ว |
| **request()** | lib/including.ts | ทำ HTTP request ระดับ top |
| **requestForChildren()** | lib/including.ts | ทำ HTTP request ระดับ child |
| **onSuccess()** | lib/including.ts | ประมวลผล includes และ branches |
| **childrening()** | lib/including.ts | จัดการ nested includes |
| **HttpClient** | lib/http-client.ts | Wrapper สำหรับ node-fetch |
| **Mapping** | lib/mapping.ts | สร้าง URL, query, identity mapping |
| **Session** | models/Session.ts | จัดเก็บ state ของแต่ละ request |
| **Include** | models/Include.ts | Configuration model |

---

## 4. รายละเอียดการทำงาน

### 4.1 Identity Mapping System

**Identity** คือระบบที่ใช้ในการดึงค่าจาก parent data เพื่อไป query child data

```typescript
interface Identity {
  key: string;      // JSON path ใน flattened data (เช่น "0.userId")
  value: any;       // ค่าที่ดึงมา
  params: string[]; // สำหรับ params mode
}
```

**ตัวอย่างการทำงาน:**

```typescript
// Config
{
  on: 'userId',      // ดึงค่าจาก parent.userId
  foreign: 'id',     // ใช้เป็น query parameter ชื่อ id
  local: 'id'        // จับคู่กับ child.id
}

// Parent data
[
  { id: 1, userId: 10 },
  { id: 2, userId: 20 }
]

// สร้าง identities
[
  { key: "0.userId", value: 10 },
  { key: "1.userId", value: 20 }
]

// สร้าง query string
"?id[]=10&id[]=20"

// Child response
[
  { id: 10, name: "User A" },
  { id: 20, name: "User B" }
]

// Map กลับไป parent
[
  { id: 1, userId: 10, includeUser: { id: 10, name: "User A" } },
  { id: 2, userId: 20, includeUser: { id: 20, name: "User B" } }
]
```

### 4.2 Flatten/Unflatten Pattern

ใช้ flatten เพื่อ:
- ดึงค่า identity จาก nested structure ได้ง่าย
- เพิ่มข้อมูลที่ตำแหน่งที่ถูกต้อง
- Rebuild structure กลับด้วย unflatten

```javascript
// Input
{
  user: {
    posts: [
      { id: 1, title: "Post 1" }
    ]
  }
}

// Flattened
{
  "user.posts": [{ id: 1, title: "Post 1" }]
}

// เพิ่มข้อมูล
{
  "user.posts": [{ id: 1, title: "Post 1" }],
  "user.posts.0.includeUser": { id: 10, name: "User A" }
}

// Unflattened
{
  user: {
    posts: [
      {
        id: 1,
        title: "Post 1",
        includeUser: { id: 10, name: "User A" }
      }
    ]
  }
}
```

### 4.3 Request Modes

**3 โหมดการ Include ข้อมูล:**

#### Mode 1: By List (default)
รวม values จาก parent หลายตัวแล้ว query ครั้งเดียว

```typescript
{
  on: 'userId',
  foreign: 'id',
  local: 'id'
}
// → GET /users?id[]=1&id[]=2&id[]=3
```

#### Mode 2: By Params
แทนค่าใน URL โดยตรง (สำหรับ single item)

```typescript
{
  params: ['userId']
}
// → GET /users/$1 → GET /users/123
```

#### Mode 3: Each (one request per parent)
ทำ request แยกสำหรับแต่ละ item ใน parent

```typescript
{
  each: true,
  on: 'id',
  foreign: 'userId'
}
// สำหรับ 10 users → ทำ 10 requests
// → GET /posts?userId=1
// → GET /posts?userId=2
// ... (10 requests)
```

### 4.4 Configuration Properties

| Property | ประเภท | คำอธิบาย | ตัวอย่าง |
|----------|--------|-----------|----------|
| `url` | string | Endpoint URL | `"https://api.com/users"` |
| `method` | string | HTTP method | `"GET"`, `"POST"` |
| `model` | string | ชื่อ property ที่ต้องการ | `"includeUser"` |
| `on` | string | Property ใน parent ที่จะดึงค่า | `"userId"` |
| `foreign` | string | Query param name | `"id"` |
| `local` | string | Property ใน child ที่จะจับคู่ | `"id"` |
| `params` | string[] | URL interpolation | `["userId"]` |
| `each` | boolean | Request แยกต่าง item | `true` |
| `delimiter` | string | Query format | `","` → `?id=1,2,3` |
| `at` | string | Data extraction path | `"data.list"` |
| `frame` | string | Wrap ผลลัพธ์ | `"data"` |
| `whole` | boolean | ใช้ response ทั้งหมด | `true` |
| `duplicate` | boolean | อนุญาต duplicate values | `true` |
| `query` | object | Base query params | `{ limit: 10 }` |
| `body` | object | Request body | `{ name: "test" }` |
| `headers` | object | Request headers | `{ "X-Token": "..." }` |
| `timeout` | number | Timeout (ms) | `5000` |
| `default` | any | ค่า default เมื่อ error | `null` |
| `selects` | string[] | Fields ที่ต้องการ | `["id", "name"]` |
| `excludes` | string[] | Fields ที่ไม่ต้องการ | `["password"]` |
| `sessions` | object | เก็บค่าใน session | `{ token: "accessToken" }` |
| `includes` | Include[] | Nested includes | `[{...}]` |
| `branches` | Include[] | Alternative data paths | `[{...}]` |
| `buildQuery` | function | Dynamic query builder | `(data) => ({...})` |
| `buildBody` | function | Dynamic body builder | `(data) => ({...})` |
| `buildHeaders` | function | Dynamic headers builder | `(data) => ({...})` |
| `onSuccess` | function | Success callback | `(err, req, res) => {}` |
| `onDone` | function | Done callback | `(err, data) => {}` |

### 4.5 Session Management

```typescript
// Session structure
Session.data = {
  [sessionId]: {
    headers: {...},      // Shared headers
    replaces: {...},     // URL replacements
    timeout: number,     // Request timeout
    session: {},         // User-defined variables
    logs: []             // HTTP request logs
  }
}
```

**การใช้งาน:**

```typescript
// ใน request แรก
{
  sessions: {
    token: 'accessToken'  // เก็บ response.accessToken ใน session
  }
}

// ใน request ถัดไป
{
  headers: {
    'Authorization': '$token'  // ใช้ค่าจาก session
  }
}
```

---

## 5. ข้อดี

### 5.1 Strong TypeScript Usage
- Strict mode enabled
- Interface-based contracts
- Type safety ทั่วทั้งโปรเจ็ค

### 5.2 Clear Separation of Concerns
- Models แยกไฟล์
- Utilities แยกชัดเจน
- Core logic modular

### 5.3 Declarative API
- กำหนดค่าแบบ config
- ไม่ต้องเขียน imperative code
- อ่านง่าย เข้าใจง่าย

### 5.4 Flexible Configuration
- รองรับหลายโหมด
- Callbacks support
- Custom builders

### 5.5 Parallel Processing
- ใช้ Promise.all() สำหรับ parallel requests
- ประมวลผลรวดเร็ว

### 5.6 Unlimited Nesting
- ซ้อน includes ได้ไม่จำกัด
- รองรับโครงสร้างข้อมูลซับซ้อน

### 5.7 Auto Data Joining
- ไม่ต้องเขียน for-loop
- ไม่ต้อง find/filter เอง
- จัดการ duplicate อัตโนมัติ

### 5.8 Session Support
- แชร์ค่าระหว่าง requests
- URL variable replacement
- Debug logging

---

## 6. ข้อเสีย

### 🔴 ปัญหาสำคัญ (High Priority)

#### 6.1 มีตัวสะกดผิด `errror` แทน `error`
**ระดับความรุนแรง:** ต่ำ
**ตำแหน่ง:** `src/lib/including.ts:59`, `src/lib/including.ts:459`

```typescript
// ❌ ผิด
results[item.model] = { errror: err };
data = { errror: e };

// ✅ ควรเป็น
results[item.model] = { error: err };
data = { error: e };
```

**ผลกระทบ:**
- Error object มี property ผิดชื่อ
- ทำให้ error handling ด้านนอกผิดพลาด

---

#### 6.2 ไม่มี Unit Tests
**ระดับความรุนแรง:** สูง
**ปัญหา:** ไม่มี test suite เลย

**ผลกระทบ:**
- เสี่ยงต่อ regression bugs
- ไม่มั่นใจเมื่อแก้ไข code
- ยากต่อการ maintain

**แนะนำ:**
```bash
npm install --save-dev jest @types/jest ts-jest
```

---

#### 6.3 Silent Exception Swallowing
**ระดับความรุนแรง:** กลาง
**ตำแหน่ง:** `src/lib/including.ts:49`, `src/lib/including.ts:56`, `src/lib/including.ts:235`, `src/lib/including.ts:420`

```typescript
// ❌ ปัญหา: callback errors ถูกกลืนไป
try {
  item.onDone(err, null);
} catch (error) {} // ไม่ทำอะไรเลย!
```

**ผลกระทบ:**
- ถ้า callback มี bug จะไม่รู้
- Debug ยาก
- Error หายไป

**แนะนำแก้:**
```typescript
try {
  item.onDone(err, null);
} catch (error) {
  console.error('onDone callback error:', error);
  // หรือ throw ต่อ
}
```

---

#### 6.4 Session Memory Leak Risk
**ระดับความรุนแรง:** กลาง
**ตำแหน่ง:** `src/models/Session.ts`

```typescript
// Session.data เก็บใน static class
static data = { [sessionId]: {...} }

// ❌ ปัญหา: clearSession() เรียกเฉพาะ success path
Promise.all(promises)
  .then(async (_results) => {
    resolveMain(results);
    Session.clearSession(id); // ✅ มีที่นี่
  })
  .catch((e) => {}); // ❌ ไม่มี cleanup!
```

**ผลกระทบ:**
- ถ้า request error, session data จะไม่ถูก clear
- Memory leak เมื่อมี request เยอะๆ
- Session data สะสมในหน่วยความจำ

**แนะนำแก้:**
```typescript
try {
  const results = await Promise.all(promises);
  resolveMain(results);
} finally {
  Session.clearSession(id); // ย้ายมาใน finally
}
```

---

#### 6.5 ไม่มี Max Recursion Depth
**ระดับความรุนแรง:** กลาง
**ตำแหน่ง:** `src/lib/including.ts:310` (onSuccess function)

```typescript
// dimension ถูกเพิ่มเรื่อยๆ แต่ไม่มีการ check
dimension: dimension + 1

// ❌ ไม่มี validation
```

**ผลกระทบ:**
- ถ้า config ผิดพลาด includes วนซ้ำ → stack overflow
- ไม่มี protection mechanism

**แนะนำแก้:**
```typescript
const MAX_DIMENSION = 10;

async function onSuccess({ sessionId, inc, data, dimension }) {
  if (dimension > MAX_DIMENSION) {
    throw new Error(`Max recursion depth (${MAX_DIMENSION}) exceeded`);
  }
  // ... rest of code
}
```

---

### 🟡 ปัญหารอง (Medium Priority)

#### 6.6 HTTP Status Code แคบเกินไป
**ตำแหน่ง:** `src/lib/http-client.ts:37`

```typescript
// ❌ ปัญหา
if (res.status > 201) {
  reject(...);
}
```

**ปัญหา:**
- Status 202 (Accepted), 204 (No Content) ถือว่าเป็น error
- แต่จริงๆ เป็น success responses

**แนะนำแก้:**
```typescript
const successStatuses = [200, 201, 202, 204];
if (!successStatuses.includes(res.status)) {
  reject(...);
}
```

---

#### 6.7 ไม่มี Input Validation
**ระดับความรุนแรง:** กลาง

**ปัญหา:**
- ไม่ check URL format
- ไม่ check required fields
- รับค่าผิด → error runtime

**แนะนำเพิ่ม:**
```typescript
function validateInclude(config: IncludeInterface) {
  if (!config.url) {
    throw new Error('URL is required');
  }
  if (!config.method) {
    throw new Error('HTTP method is required');
  }
  if (!config.model) {
    throw new Error('Model name is required');
  }
  try {
    new URL(config.url);
  } catch {
    throw new Error(`Invalid URL format: ${config.url}`);
  }
}
```

---

#### 6.8 Promise Chain ซับซ้อน
**ตำแหน่ง:** ทั่วทั้งไฟล์ `src/lib/including.ts`

```typescript
// ❌ ยาก debug
promise
  .then((data) => {
    return anotherPromise()
      .then((result) => {
        return yetAnotherPromise()
          .catch((e) => {})
      })
      .catch((e) => {})
  })
  .catch((e) => {})
```

**แนะนำ Refactor เป็น async/await:**
```typescript
// ✅ อ่านง่ายกว่า
try {
  const data = await promise;
  const result = await anotherPromise();
  const final = await yetAnotherPromise();
} catch (error) {
  // handle error
}
```

---

#### 6.9 ไม่มี Timeout Enforcement
**ตำแหน่ง:** `src/lib/http-client.ts`

**ปัญหา:**
- มี parameter `timeout` แต่ไม่ได้ enforce จริง
- node-fetch v2 ไม่รองรับ timeout โดยตรง

**แนะนำแก้:**
```typescript
function fetchWithTimeout(url: string, options: any, timeout: number) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}
```

---

#### 6.10 Performance - ไม่เหมาะกับ Scale ใหญ่
**ปัญหา:**
- ไม่มี connection pooling
- ไม่มี caching mechanism
- Flatten/unflatten ทุก level (overhead)
- สร้าง HttpClient instance ใหม่ทุกครั้ง

**แนะนำ:**
- ใช้ HTTP agent กับ connection pool
- เพิ่ม cache layer สำหรับ duplicate requests
- Reuse HttpClient instances

---

### 🟢 ปัญหาเล็กน้อย (Low Priority)

#### 6.11 Unflatten Array Reconstruction
**ตำแหน่ง:** `src/lib/my-object.ts:27-42`

**ปัญหา:**
- Reconstruct arrays ด้วยการ push
- อาจมีปัญหากับ sparse arrays

#### 6.12 Query Parameter Builder Limitations
**ตำแหน่ง:** `src/lib/mapping.ts:25-46`

**ปัญหา:**
- รองรับแค่ string values ที่ขึ้นต้นด้วย `$`
- ไม่รองรับ complex objects

#### 6.13 ไม่มี Documentation ในโค้ด
**ปัญหา:**
- JSDoc/TypeDoc comments น้อยมาก
- ทำให้ IDE autocomplete ไม่แสดงรายละเอียด

---

## 7. คำแนะนำการแก้ไข

### 📌 Priority 1: ควรแก้ทันที

#### 1. แก้ไขการสะกดผิด
```bash
# ไฟล์: src/lib/including.ts
# บรรทัด: 59, 459
```

**เปลี่ยนจาก:**
```typescript
results[item.model] = { errror: err };
data = { errror: e };
```

**เป็น:**
```typescript
results[item.model] = { error: err };
data = { error: e };
```

---

#### 2. เพิ่ม Unit Tests

**ติดตั้ง:**
```bash
npm install --save-dev jest @types/jest ts-jest
```

**สร้างไฟล์ jest.config.js:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ]
};
```

**ตัวอย่าง test:**
```typescript
// src/lib/__tests__/including.test.ts
import { including } from '../including';

describe('including', () => {
  it('should fetch and combine data', async () => {
    // Mock fetch
    // Test basic functionality
  });

  it('should handle errors gracefully', async () => {
    // Test error handling
  });
});
```

---

#### 3. ปรับปรุง Error Handling

**ไฟล์:** `src/lib/including.ts`

**เปลี่ยนจาก:**
```typescript
try {
  item.onDone(err, null);
} catch (error) {}
```

**เป็น:**
```typescript
try {
  item.onDone(err, null);
} catch (error) {
  console.error('Error in onDone callback:', error);
  // หรือสามารถ throw ต่อได้ตามต้องการ
}
```

---

#### 4. เพิ่ม Max Recursion Depth

**ไฟล์:** `src/lib/including.ts`

**เพิ่มที่ต้นไฟล์:**
```typescript
const MAX_RECURSION_DEPTH = 10;
```

**เพิ่มใน onSuccess():**
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
  // ✅ เพิ่ม validation
  if (dimension > MAX_RECURSION_DEPTH) {
    throw new Error(
      `Maximum recursion depth (${MAX_RECURSION_DEPTH}) exceeded at dimension ${dimension}`
    );
  }

  // ... rest of code
}
```

---

#### 5. แก้ Session Cleanup

**ไฟล์:** `src/lib/including.ts`

**เปลี่ยนจาก:**
```typescript
Promise.all(promises)
  .then(async (_results) => {
    resolveMain(results);
    if (Session.isSaveLogs) {
      try {
        await Session.writeLog(id);
      } catch (error) {}
    }
    Session.clearSession(id);
  })
  .catch((e) => {});
```

**เป็น:**
```typescript
try {
  await Promise.all(promises);
  resolveMain(results);
  if (Session.isSaveLogs) {
    try {
      await Session.writeLog(id);
    } catch (error) {
      console.error('Error writing logs:', error);
    }
  }
} catch (error) {
  console.error('Error in promise execution:', error);
  rejectMain(error);
} finally {
  Session.clearSession(id);
}
```

---

### 📌 Priority 2: ควรปรับปรุง

#### 6. รองรับ HTTP Status ที่หลากหลาย

**ไฟล์:** `src/lib/http-client.ts`

```typescript
const SUCCESS_STATUS_CODES = [200, 201, 202, 204];

// ใน request method
if (!SUCCESS_STATUS_CODES.includes(res.status)) {
  reject({
    status: res.status,
    statusText: res.statusText,
    body: body
  });
}
```

---

#### 7. เพิ่ม Input Validation

**สร้างไฟล์ใหม่:** `src/lib/validation.ts`

```typescript
export function validateIncludeConfig(config: any): void {
  // Required fields
  if (!config.url) {
    throw new Error('Include config error: "url" is required');
  }
  if (!config.method) {
    throw new Error('Include config error: "method" is required');
  }
  if (!config.model) {
    throw new Error('Include config error: "model" is required');
  }

  // URL format validation
  try {
    new URL(config.url);
  } catch (error) {
    // อนุญาต relative URLs
    if (!config.url.startsWith('/') && !config.url.startsWith('$')) {
      throw new Error(`Include config error: invalid URL format "${config.url}"`);
    }
  }

  // Method validation
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  if (!validMethods.includes(config.method.toUpperCase())) {
    throw new Error(
      `Include config error: invalid HTTP method "${config.method}". ` +
      `Must be one of: ${validMethods.join(', ')}`
    );
  }

  // Mutual exclusivity checks
  if (config.each && config.params) {
    throw new Error('Include config error: "each" and "params" cannot be used together');
  }

  if (config.selects && config.excludes) {
    throw new Error('Include config error: "selects" and "excludes" cannot be used together');
  }
}
```

**ใช้งานใน Include.fromJSON():**
```typescript
// src/models/Include.ts
import { validateIncludeConfig } from '../lib/validation';

static fromJSON(json: IncludeInterface): Include {
  validateIncludeConfig(json);
  return new Include(json);
}
```

---

#### 8. Refactor เป็น async/await

**ตัวอย่างการ refactor function `request()`:**

**เดิม (Promise chaining):**
```typescript
function request(inc, { sessionId }) {
  return new Promise((resolve, reject) => {
    httpClient
      .request(url, params)
      .then(async (data) => {
        // ... nested logic
      })
      .catch((e) => {
        resolve({ isError: true, error: e });
      });
  });
}
```

**ใหม่ (async/await):**
```typescript
async function request(
  inc: Include,
  { sessionId }: { sessionId: string }
): Promise<any> {
  try {
    let url = replaceUrl(inc.url, Session.getReplaces(sessionId));
    const httpClient = new HttpClient({ sessionId });
    const params = {
      query: inc.query,
      method: inc.method,
      headers: {
        ...Session.getHeaders(sessionId),
        ...inc.headers,
      },
      body: inc.body,
      timeout: inc.timeout || Session.getTimeout(sessionId),
    };

    let data = await httpClient.request(url, params);

    // Call onSuccess callback
    if (inc.onSuccess) {
      try {
        inc.onSuccess(null, { url, ...params }, data);
      } catch (error) {
        console.error('Error in onSuccess callback:', error);
      }
    }

    // Non-object data
    if (typeof data !== 'object') {
      return data;
    }

    // Frame wrapping
    if (inc.frame?.length) {
      data = { [inc.frame]: data };
    } else if (inc.isShouldHaveFrame(data)) {
      data = { data };
    }

    // Extract data at path
    if (inc.at) {
      data = MyObject.get(inc.at, data);
    }

    // Store session values
    if (inc.sessions) {
      try {
        for (let key of Object.keys(inc.sessions)) {
          Session.setSession(sessionId, inc.sessions[key], data[key]);
        }
      } catch (error) {
        console.error('Error storing session values:', error);
      }
    }

    // Process nested includes
    try {
      data = await onSuccess({
        sessionId,
        inc,
        data,
        dimension: 1,
      });

      if (inc.selects || inc.excludes) {
        data = selectsAndExcludes(data, inc);
      }
    } catch (error) {
      console.error('Error in onSuccess:', error);
      data = { error };
    }

    return data;
  } catch (error) {
    return {
      isError: true,
      error,
    };
  }
}
```

---

#### 9. เพิ่ม Logging Levels

**สร้างไฟล์ใหม่:** `src/lib/logger.ts`

```typescript
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export class Logger {
  private static level: LogLevel = LogLevel.INFO;

  static setLevel(level: LogLevel) {
    this.level = level;
  }

  static debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  static info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  static warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  static error(message: string, ...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}
```

**ใช้งาน:**
```typescript
import { Logger, LogLevel } from './lib/logger';

// Set log level
Logger.setLevel(LogLevel.DEBUG);

// Use in code
Logger.debug('Fetching data from:', url);
Logger.info('Request completed successfully');
Logger.error('Request failed:', error);
```

---

#### 10. เพิ่ม TypeDoc Comments

**ตัวอย่าง:**

```typescript
/**
 * Fetches data from multiple endpoints and combines them based on relationships
 *
 * @param param - Configuration object for the including operation
 * @param param.list - Array of endpoint configurations to fetch and combine
 * @param param.headers - Optional global headers to include in all requests
 * @param param.replaces - Optional URL variable replacements
 * @param param.timeout - Optional global timeout in milliseconds
 *
 * @returns Promise that resolves with combined data object
 *
 * @example
 * ```typescript
 * const result = await including({
 *   list: [{
 *     url: 'https://api.example.com/posts',
 *     method: 'GET',
 *     model: 'posts',
 *     includes: [{
 *       url: 'https://api.example.com/users',
 *       method: 'GET',
 *       model: 'user',
 *       on: 'userId',
 *       foreign: 'id',
 *       local: 'id'
 *     }]
 *   }]
 * });
 * ```
 */
export function including(param: IIncludingParam): Promise<any> {
  // ...
}
```

---

### 📌 Priority 3: Nice to Have

#### 11. เพิ่ม Caching Layer

```typescript
// src/lib/cache.ts
export class SimpleCache {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static ttl = 60000; // 1 minute

  static set(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  static clear() {
    this.cache.clear();
  }
}
```

---

#### 12. Connection Pooling

```typescript
// src/lib/http-client.ts
import fetch from 'node-fetch';
import http from 'http';
import https from 'https';

// Create agents with connection pooling
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50
});

// Use in fetch
fetch(url, {
  ...options,
  agent: url.startsWith('https') ? httpsAgent : httpAgent
});
```

---

#### 13. เพิ่ม Retry Logic

```typescript
// src/lib/retry.ts
export async function fetchWithRetry(
  url: string,
  options: any,
  maxRetries = 3,
  delay = 1000
): Promise<any> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError!;
}
```

---

#### 14. Progress Callback

```typescript
// เพิ่มใน IIncludingParam
export interface IIncludingParam {
  replaces?: any;
  headers?: any;
  list: IncludeInterface[];
  timeout?: number;
  onProgress?: (completed: number, total: number) => void; // ✅ เพิ่ม
}

// ใช้งานใน including()
let completed = 0;
const total = promises.length;

for (let promise of promises) {
  promise.finally(() => {
    completed++;
    if (param.onProgress) {
      param.onProgress(completed, total);
    }
  });
}
```

---

#### 15. Bundle Size Optimization

**ติดตั้ง bundler:**
```bash
npm install --save-dev rollup @rollup/plugin-typescript
```

**สร้าง rollup.config.js:**
```javascript
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs'
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm'
    }
  ],
  plugins: [
    typescript()
  ],
  external: ['node-fetch', 'flat', 'object-query-string']
};
```

---

## 8. ตัวอย่างการใช้งาน

### 8.1 Basic Include - Single Item

```typescript
import { including } from 'including';

const result = await including({
  list: [{
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    method: 'GET',
    model: 'post',
    includes: [{
      url: 'https://jsonplaceholder.typicode.com/users/$1',
      method: 'GET',
      model: 'user',
      params: ['userId']
    }]
  }]
});

console.log(result);
// {
//   post: {
//     id: 1,
//     userId: 1,
//     title: "...",
//     user: { id: 1, name: "Leanne Graham", ... }
//   }
// }
```

---

### 8.2 Basic Include - List with Filter Join

```typescript
const result = await including({
  list: [{
    url: 'https://jsonplaceholder.typicode.com/posts',
    method: 'GET',
    model: 'posts',
    includes: [{
      url: 'https://jsonplaceholder.typicode.com/users',
      method: 'GET',
      model: 'user',
      on: 'userId',     // ดึง userId จาก posts
      foreign: 'id',    // ใช้เป็น query param: ?id[]=1&id[]=2
      local: 'id'       // จับคู่กับ user.id
    }]
  }]
});

// GET /posts
// → ดึง userIds ที่ unique: [1, 2, 3]
// GET /users?id[]=1&id[]=2&id[]=3
// → join กลับไป posts
```

---

### 8.3 Nested Includes (Multi-level)

```typescript
const result = await including({
  list: [{
    url: 'https://api.example.com/posts',
    method: 'GET',
    model: 'posts',
    includes: [{
      url: 'https://api.example.com/users',
      method: 'GET',
      model: 'user',
      on: 'userId',
      foreign: 'id',
      local: 'id',
      includes: [{  // ซ้อนระดับที่ 2
        url: 'https://api.example.com/addresses',
        method: 'GET',
        model: 'address',
        on: 'addressId',
        foreign: 'id',
        local: 'id'
      }]
    }]
  }]
});

// posts → users → addresses (3 levels)
```

---

### 8.4 Each Mode (Per-Item Requests)

```typescript
const result = await including({
  list: [{
    url: 'https://api.example.com/users',
    method: 'GET',
    model: 'users',
    includes: [{
      url: 'https://api.example.com/posts',
      method: 'GET',
      model: 'posts',
      each: true,       // ✅ Request แยกสำหรับแต่ละ user
      on: 'id',
      foreign: 'userId'
    }]
  }]
});

// สำหรับ 10 users:
// GET /posts?userId=1
// GET /posts?userId=2
// ... (10 requests รวม)
```

---

### 8.5 Branches (Alternative Data Path)

```typescript
const result = await including({
  list: [{
    url: 'https://api.example.com/posts',
    method: 'GET',
    model: 'posts',
    branches: [{  // ✅ ใช้ branches แทน includes
      url: 'https://api.example.com/users',
      method: 'GET',
      model: 'allUsers',
      on: 'userId',
      foreign: 'id',
      local: 'id'
    }]
  }]
});

// branches จะ wrap ใน frame โดยอัตโนมัติ
// { posts: [...], allUsers: { data: [...] } }
```

---

### 8.6 Field Selection

```typescript
const result = await including({
  list: [{
    url: 'https://api.example.com/posts',
    method: 'GET',
    model: 'posts',
    selects: ['id', 'title', 'user'],  // ✅ เลือกเฉพาะ fields
    includes: [{
      url: 'https://api.example.com/users',
      method: 'GET',
      model: 'user',
      selects: ['id', 'name', 'email'],  // ✅ เลือก fields ของ user
      on: 'userId',
      foreign: 'id',
      local: 'id'
    }]
  }]
});

// จะได้เฉพาะ fields ที่ระบุ
// posts: [{ id, title, user: { id, name, email } }]
```

---

### 8.7 Field Exclusion

```typescript
const result = await including({
  list: [{
    url: 'https://api.example.com/users',
    method: 'GET',
    model: 'users',
    excludes: ['password', 'salt', 'privateKey']  // ✅ ไม่เอา fields เหล่านี้
  }]
});

// ได้ทุก fields ยกเว้น password, salt, privateKey
```

---

### 8.8 Custom Query Builder

```typescript
const result = await including({
  list: [{
    url: 'https://api.example.com/posts',
    method: 'GET',
    model: 'posts',
    includes: [{
      url: 'https://api.example.com/users',
      method: 'GET',
      model: 'users',
      buildQuery: (parentData) => {
        // ✅ สร้าง query แบบ dynamic
        const userIds = parentData.map(p => p.userId);
        return {
          id: userIds,
          fields: 'id,name,email',
          limit: 100
        };
      }
    }]
  }]
});
```

---

### 8.9 Session Variables

```typescript
const result = await including({
  list: [
    {
      // Request 1: Login
      url: 'https://api.example.com/login',
      method: 'POST',
      model: 'auth',
      body: { username: 'user', password: 'pass' },
      sessions: {
        token: 'accessToken'  // ✅ เก็บ response.accessToken
      }
    },
    {
      // Request 2: ใช้ token จาก session
      url: 'https://api.example.com/profile',
      method: 'GET',
      model: 'profile',
      headers: {
        'Authorization': 'Bearer $token'  // ✅ ใช้ค่าจาก session
      }
    }
  ]
});
```

---

### 8.10 URL Replacements

```typescript
const result = await including({
  replaces: {
    apiUrl: 'https://api.example.com',
    version: 'v2'
  },
  list: [{
    url: '$apiUrl/$version/posts',  // ✅ → https://api.example.com/v2/posts
    method: 'GET',
    model: 'posts'
  }]
});
```

---

### 8.11 Callbacks

```typescript
const result = await including({
  list: [{
    url: 'https://api.example.com/posts',
    method: 'GET',
    model: 'posts',
    onSuccess: (error, request, response) => {
      // ✅ เรียกทุกครั้งที่ request สำเร็จ
      console.log('Request:', request);
      console.log('Response:', response);
    },
    onDone: (error, data) => {
      // ✅ เรียกเมื่อเสร็จทั้งหมด (includes ด้วย)
      if (error) {
        console.error('Error:', error);
      } else {
        console.log('Final data:', data);
      }
    }
  }]
});
```

---

### 8.12 Delimiter Format

```typescript
// Query string แบบ: ?id=1,2,3 แทน ?id[]=1&id[]=2
const result = await including({
  list: [{
    url: 'https://api.example.com/posts',
    method: 'GET',
    model: 'posts',
    includes: [{
      url: 'https://api.example.com/users',
      method: 'GET',
      model: 'users',
      delimiter: ',',  // ✅ ใช้ comma
      on: 'userId',
      foreign: 'id',
      local: 'id'
    }]
  }]
});

// GET /users?id=1,2,3
```

---

### 8.13 Data Extraction (at)

```typescript
const result = await including({
  list: [{
    url: 'https://api.example.com/posts',
    method: 'GET',
    model: 'posts',
    at: 'data.items'  // ✅ ดึงข้อมูลจาก response.data.items
  }]
});

// Response: { data: { items: [...] } }
// → ได้แค่ [...] ส่วน items
```

---

### 8.14 Frame Wrapping

```typescript
const result = await including({
  list: [{
    url: 'https://api.example.com/posts',
    method: 'GET',
    model: 'posts',
    frame: 'results'  // ✅ ห่อผลลัพธ์
  }]
});

// Response: [...]
// → { results: [...] }
```

---

### 8.15 Default Value on Error

```typescript
const result = await including({
  list: [{
    url: 'https://api.example.com/posts',
    method: 'GET',
    model: 'posts',
    includes: [{
      url: 'https://api.example.com/users',
      method: 'GET',
      model: 'user',
      on: 'userId',
      foreign: 'id',
      local: 'id',
      default: null  // ✅ ถ้า error ให้ใช้ null
    }]
  }]
});

// ถ้า GET /users fail → user: null
```

---

### 8.16 Combining (Enrich Existing Data)

```typescript
import { combining } from 'including';

const posts = [
  { id: 1, userId: 1, title: "Post 1" },
  { id: 2, userId: 2, title: "Post 2" }
];

const enriched = await combining({
  data: posts,
  includes: [{
    url: 'https://api.example.com/users',
    method: 'GET',
    model: 'user',
    on: 'userId',
    foreign: 'id',
    local: 'id'
  }]
});

// posts ที่มีอยู่แล้ว + user data
```

---

## 9. สรุปและคะแนน

### คะแนนรวม: 7.5/10

### ✅ จุดเด่น

1. **Architecture ดี** - Layer แยกชัดเจน, modular
2. **Feature ครบ** - รองรับ use cases ส่วนใหญ่
3. **TypeScript Support ดี** - Type safety, strict mode
4. **Declarative API** - ใช้งานง่าย, อ่านโค้ดง่าย
5. **Parallel Processing** - ประมวลผลเร็ว
6. **Flexible** - รองรับหลายโหมด, callbacks, custom builders

### ⚠️ จุดอ่อน

1. **ไม่มี Unit Tests** - เสี่ยงต่อ bugs, ยาก maintain
2. **Error Handling ไม่สมบูรณ์** - Silent failures, no retry
3. **Code Quality Issues** - Typos, exception swallowing
4. **Memory Leak Risk** - Session cleanup ไม่ครบ
5. **Performance** - ไม่มี caching, connection pooling

### 🎯 ถ้าแก้ตามคำแนะนำ

**คะแนนอาจขึ้นเป็น:** 9/10

**Priority สูง:**
1. แก้ typo `errror` → `error`
2. เพิ่ม unit tests
3. ปรับปรุง error handling
4. แก้ session cleanup
5. เพิ่ม max recursion limit

**Priority กลาง:**
6. Input validation
7. Refactor เป็น async/await
8. Logging levels
9. HTTP status codes
10. TypeDoc comments

**Priority ต่ำ:**
11. Caching layer
12. Connection pooling
13. Retry logic
14. Performance optimization

---

## สรุป

**Including.js เป็น library ที่:**
- ✅ ใช้งานได้จริง, แก้ปัญหาได้ดี
- ✅ Architecture สะอาด, code organized
- ✅ Feature ครบสำหรับ data combining
- ⚠️ ต้องปรับปรุง testing และ error handling
- ⚠️ ควรเพิ่ม validation และ optimization

**เหมาะสำหรับ:**
- Backend-for-Frontend (BFF) patterns
- API aggregation services
- Data enrichment pipelines
- Microservices data joining

**ไม่เหมาะสำหรับ:**
- Browser usage (ใช้ node-fetch)
- Real-time applications (no WebSocket)
- Very high-scale systems (ต้อง optimize ก่อน)

---

**เอกสารนี้สร้างโดย:** Claude Code Analysis
**วันที่:** 27 ตุลาคม 2025
**เวอร์ชันที่วิเคราะห์:** 0.0.25
