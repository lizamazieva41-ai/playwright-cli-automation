# 04. Local API Documentation

## Overview

REST API specification for the Windows Desktop Cloud Browser Model local implementation.

**Version:** 1.0  
**Base URL:** `http://localhost:3000/api`  
**Last Updated:** 2026-02-19

---

## 1. Profile Management Endpoints

### 1.1 Create Profile

**Endpoint:** `POST /api/profile/create`

**Request Body:**
```json
{
  "name": "Profile Name",
  "groupId": "uuid-optional",
  "tags": ["uuid1", "uuid2"],
  "proxyId": "uuid-optional",
  "browserType": "firefox",
  "timezone": "America/New_York",
  "locale": "en-US"
}
```

**Response (201):**
```json
{
  "id": "generated-uuid",
  "name": "Profile Name",
  "groupId": "uuid-or-null",
  "tags": ["uuid1", "uuid2"],
  "proxyId": "uuid-or-null",
  "browserType": "firefox",
  "timezone": "America/New_York",
  "locale": "en-US",
  "createdAt": "2026-02-19T03:07:01.991Z",
  "updatedAt": "2026-02-19T03:07:01.991Z",
  "lastUsedAt": null
}
```

**Notes:**
- `lastUsedAt` is null on creation
- See `14-parity-matrix.md` Section 2.1 for complete field list

### 1.2 Start Profile Session

**Endpoint:** `POST /api/profile/start/:id`

**Response (200):**
```json
{
  "id": "profile-uuid",
  "sessionId": "session-uuid",
  "status": "active",
  "lastUsedAt": "2026-02-19T03:07:01.991Z"
}
```

**Side Effects:**
- Updates `profiles.lastUsedAt` to current timestamp
- Launches browser instance
- Emits `profile.start` event to background agent

**See Also:** `03-background-agent.md` Section 2.1

### 1.3 List Profiles

**Endpoint:** `GET /api/profile/list`

**Query Parameters:**
- `groupId` (optional): Filter by group
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Profile 1",
      "groupId": "uuid",
      "lastUsedAt": "2026-02-19T03:07:01.991Z",
      "createdAt": "2026-02-19T02:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

## 2. Group Management Endpoints

### 2.1 List Groups

**Endpoint:** `GET /api/group/list`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Marketing Team",
      "description": "Marketing profiles",
      "color": "#FF5733",
      "profileCount": 15,
      "createdAt": "2026-02-01T10:00:00Z",
      "updatedAt": "2026-02-15T14:30:00Z"
    }
  ]
}
```

**Notes:**
- `profileCount` is computed real-time via database query
- See `14-parity-matrix.md` Section 3 for profileCount definition
- See `migration-plan.md` Section 3.1 for query implementation

### 2.2 Get Group Detail

**Endpoint:** `GET /api/group/detail/:id`

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Marketing Team",
  "description": "Marketing profiles",
  "color": "#FF5733",
  "profileCount": 15,
  "createdAt": "2026-02-01T10:00:00Z",
  "updatedAt": "2026-02-15T14:30:00Z",
  "profiles": [
    {
      "id": "profile-uuid-1",
      "name": "Profile 1"
    }
  ]
}
```

---

## 3. Tag Management Endpoints

### 3.1 List Tags

**Endpoint:** `GET /api/tag/list`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "High Priority",
      "color": "#FF0000",
      "profileCount": 23,
      "createdAt": "2026-02-01T10:00:00Z",
      "updatedAt": "2026-02-15T14:30:00Z"
    }
  ]
}
```

**Notes:**
- `profileCount` computed from `profile_tags` junction table
- See `migration-plan.md` Section 3.2 for query

---

## 4. Proxy Management Endpoints

### 4.1 List Proxies

**Endpoint:** `GET /api/proxy/list`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "US Proxy 1",
      "type": "socks5",
      "host": "proxy.example.com",
      "port": 1080,
      "profileCount": 8,
      "createdAt": "2026-02-01T10:00:00Z",
      "updatedAt": "2026-02-15T14:30:00Z"
    }
  ]
}
```

**Notes:**
- `password` field omitted from list response for security
- `profileCount` shows how many profiles use this proxy

---

## 5. Environment Endpoints

### 5.1 System Information

**Endpoint:** `GET /api/env/info`

**Response (200):**
```json
{
  "version": "1.0.0",
  "platform": "windows",
  "browserVersion": "122.0",
  "nodeVersion": "18.19.0"
}
```

### 5.2 API Version

**Endpoint:** `GET /api/env/version`

**Response (200):**
```json
{
  "apiVersion": "1.0",
  "compatibility": "morelogin-1.0"
}
```

### 5.3 Clean Cloud Cache (N/A)

**Endpoint:** `GET /api/env/cache/cleanCloud`

**Status:** Not Implemented (Cloud-only feature)

**Response (501):**
```json
{
  "error": "Not Implemented",
  "message": "Cloud cache management not available in self-hosted version",
  "reference": "See scope-exceptions.md"
}
```

**See:** `scope-exceptions.md` Section 1.1

---

## 6. Data Types

### 6.1 Timestamp Format

All timestamps use ISO 8601 with UTC timezone:
- **Format:** `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Example:** `2026-02-19T03:07:01.991Z`

### 6.2 UUID Format

- **Format:** UUID v4
- **Example:** `550e8400-e29b-41d4-a716-446655440000`

---

## 7. Error Responses

### 7.1 Standard Error Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 7.2 Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
- `501` - Not Implemented

---

## 8. Related Documents

- `14-parity-matrix.md` - API compatibility matrix
- `12-api-compatibility.md` - Detailed compatibility notes
- `openapi.yaml` - OpenAPI 3.0 specification
- `migration-plan.md` - Database schema

