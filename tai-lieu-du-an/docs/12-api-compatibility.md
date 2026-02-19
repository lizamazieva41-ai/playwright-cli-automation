# 12. API Compatibility Notes

## Overview

Detailed compatibility notes between MoreLogin Cloud API and Local Implementation.

**Version:** 1.0  
**Last Updated:** 2026-02-19

---

## 1. Endpoint Compatibility

### 1.1 Fully Compatible Endpoints (29/30)

All profile, group, tag, and proxy management endpoints maintain 100% compatibility with MoreLogin API:

- Request/response formats identical
- Field names and types match
- Error handling consistent
- Status codes aligned

**See:** `14-parity-matrix.md` Sections 1.1-1.4 for complete list

### 1.2 Cloud-Specific Endpoints (1/30)

#### GET /api/env/cache/cleanCloud

**Status:** Not Implemented (N/A)

**Reason:** Cloud infrastructure management endpoint with no local equivalent.

**Response:** 501 Not Implemented with error message

**Alternative:** Use local file system cache management or profile reset operations

**Documentation:** See `scope-exceptions.md` Section 1.1

---

## 2. Data Model Compatibility

### 2.1 Computed Fields

#### profileCount

**Implementation:** Fully compatible with MoreLogin

**Method:**
- Real-time database query (no caching)
- Uses indexed foreign keys for performance
- Always reflects current state

**Queries:**
```sql
-- For Groups
SELECT COUNT(*) FROM profiles WHERE groupId = ?

-- For Tags  
SELECT COUNT(*) FROM profile_tags WHERE tagId = ?

-- For Proxies
SELECT COUNT(*) FROM profiles WHERE proxyId = ?
```

**Performance:** <10ms typical query time with indexes

**Documentation:** See `14-parity-matrix.md` Section 3

#### lastUsedAt

**Implementation:** Fully compatible with MoreLogin

**Format:** ISO 8601 timestamp with UTC timezone

**Update Behavior:**
- Updated on every session start
- Includes GUI, CLI, API, and headless launches
- Not updated on metadata changes

**Example Value:** `2026-02-19T03:07:01.991Z`

**Documentation:** See `14-parity-matrix.md` Section 4

---

## 3. Behavioral Differences

### 3.1 Browser Engine

**MoreLogin:** Chromium-based with custom modifications

**Local Implementation:** Firefox (via Playwright) or Chromium

**Impact:** Minor differences in fingerprinting and automation capabilities

**Mitigation:** Stealth mode and fingerprint protection configured for compatibility

### 3.2 Session Storage

**MoreLogin:** Cloud-based session storage

**Local Implementation:** Local SQLite database and file system

**Impact:** No cloud sync, faster local access

**Benefits:** 
- Better privacy (data stays local)
- Faster session restoration
- No network dependency

### 3.3 Proxy Management

**MoreLogin:** May have built-in proxy services

**Local Implementation:** User-provided proxies only

**Impact:** Users must configure their own proxy infrastructure

---

## 4. Authentication & Security

### 4.1 Authentication Model

**Local Implementation:**
- No cloud authentication required
- Optional local password protection
- API key for external access (optional)

**MoreLogin Cloud:**
- Account-based authentication
- Cloud user management
- Subscription-based access

### 4.2 Data Privacy

**Local Advantage:**
- All data stored locally
- No data sent to cloud services
- Full user control over data

---

## 5. Performance Characteristics

### 5.1 Response Times

| Operation | MoreLogin Cloud | Local Implementation | Notes |
|-----------|----------------|---------------------|-------|
| List Profiles | 200-500ms | 10-50ms | Local DB faster |
| Start Session | 2-5s | 1-3s | No network overhead |
| profileCount | ~100ms | <10ms | Indexed queries |
| Create Profile | 300-600ms | 50-150ms | Local storage |

### 5.2 Scalability

**Local Implementation:**
- Limited by local hardware resources
- Typical capacity: 100-500 profiles
- Can handle 5-10 concurrent browser sessions

**MoreLogin Cloud:**
- Cloud infrastructure scaling
- Larger profile capacity
- Higher concurrency potential

---

## 6. Migration Path

### 6.1 Import from MoreLogin

**Planned Support:**
- Export profiles from MoreLogin
- Import into local implementation
- Maintain data compatibility

**Format:** JSON export/import

### 6.2 Data Portability

All data stored in standard formats:
- SQLite database (portable)
- JSON configuration files
- Standard cookie/localStorage formats

---

## 7. Testing & Validation

### 7.1 Compatibility Testing

- Unit tests for all endpoints
- Integration tests with Playwright
- API contract testing
- Field validation tests

### 7.2 Parity Verification

Run documentation consistency checker:
```bash
node tai-lieu-du-an/scripts/doc-consistency-check/check.js
```

Should validate:
- Endpoint count accuracy
- Field completeness
- No ambiguous Partial definitions
- Computed fields fully defined

---

## 8. Related Documents

- `14-parity-matrix.md` - Complete compatibility matrix
- `04-local-api.md` - API specification
- `scope-exceptions.md` - Documented exceptions
- `migration-plan.md` - Database schema

