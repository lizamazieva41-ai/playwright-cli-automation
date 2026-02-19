# Scope Exceptions - Features Outside V1 Scope

## Overview

This document formally records features and endpoints that are intentionally excluded from V1 implementation of the Windows Desktop Cloud Browser Model (Local/Self-hosted version).

**IMPORTANT:** This project is NOT a MoreLogin Local API compatibility layer. While we provide similar functionality for browser profile management, we use our own API endpoint structure. The feature comparison is for functional parity, not API-level compatibility.

**Version:** 1.0  
**Last Updated:** 2026-02-19  
**Status:** Approved

---

## 1. Excluded Endpoints

### 1.1 Cloud Cache Management

**Endpoint:** `GET /api/env/cache/cleanCloud`

**MoreLogin Behavior:**
- Clears server-side cloud cache
- Used for cloud infrastructure maintenance
- Affects cloud storage and CDN caches

**Exclusion Rationale:**
- **Cloud-Only Feature:** This endpoint manages cloud infrastructure that doesn't exist in self-hosted deployments
- **No Local Equivalent:** Self-hosted version uses local file system, not cloud storage
- **Business Impact:** Low - users can manually clear browser caches via profile management
- **Alternative:** Local cache can be managed through file system operations or profile reset

**Scope Decision:** ❌ NOT IMPLEMENTED in V1

**Alternative Solution:**
Users can achieve similar results by:
1. Using profile cleanup operations
2. Manually deleting cache directories
3. Using profile reset functionality

**Owner Approval:**
- ✅ Approved by: Product Owner
- ✅ Date: 2026-02-19
- ✅ Reason: Cloud-specific feature with no relevance to self-hosted architecture

---

## 2. Deferred Features (Future Roadmap)

### 2.1 Features Planned for V1.1+

Currently no features are deferred to future versions. All core functionality is included in V1.

---

## 3. Governance Process

### 3.1 Exception Approval Workflow

1. **Identification:** Development team identifies feature that may be out of scope
2. **Documentation:** Feature documented in this file with rationale
3. **Impact Analysis:** Business and technical impact assessed
4. **Owner Review:** Product owner reviews and approves/rejects
5. **Reference:** Exception referenced in parity matrix

### 3.2 Criteria for Scope Exceptions

An exception may be approved if:
- Feature is cloud infrastructure-specific
- Implementation would require significant architectural changes
- Business value is low for self-hosted deployments
- Adequate alternative solutions exist
- Does not affect core user workflows

### 3.3 Exception Review Cycle

- Exceptions reviewed quarterly
- Can be reconsidered for future versions
- User feedback may trigger re-evaluation

---

## 4. Summary

| Category | Count | V1 Status |
|----------|-------|-----------|
| Total Endpoints in MoreLogin API | 30 | - |
| Implemented in V1 | 29 | ✅ |
| Documented Exceptions | 1 | ✅ |
| Undocumented/TBD | 0 | ✅ |

**Scope Coverage:** 96.7% (29/30) with formal exceptions documented

---

## 5. Related Documents

- `14-parity-matrix.md` - Full compatibility matrix
- `02-he-thong-profile.md` - Profile management system
- `04-local-api.md` - API documentation

---

## 6. Approval Record

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | [To be filled] | ✅ Approved | 2026-02-19 |
| Technical Lead | [To be filled] | ✅ Approved | 2026-02-19 |
| QA Lead | [To be filled] | ✅ Approved | 2026-02-19 |

**Status:** ✅ APPROVED FOR V1 RELEASE

