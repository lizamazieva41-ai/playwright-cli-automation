# 02. Profile Management System

## Overview

This document describes the Profile Management System for the Windows Desktop Cloud Browser Model.

**Version:** 1.0  
**Last Updated:** 2026-02-19

---

## 1. Profile Lifecycle

### 1.1 Profile States

- **Created:** Initial state after profile creation
- **Active:** Profile browser session is running
- **Stopped:** Profile exists but browser session is closed
- **Archived:** Profile marked for deletion

### 1.2 Profile Operations

#### Create Profile
- Generates unique UUID
- Initializes browser configuration
- Sets createdAt timestamp
- Sets lastUsedAt to null

#### Start Profile Session
- Launches browser with stored configuration
- Updates lastUsedAt to current timestamp (ISO8601)
- Transitions profile to Active state
- Emits `profile.start` event to background agent

#### Stop Profile Session
- Closes browser session
- Saves cookies and localStorage
- Transitions profile to Stopped state
- Emits `profile.stop` event

#### Update Profile
- Modifies profile configuration
- Updates updatedAt timestamp
- Does NOT update lastUsedAt

#### Delete Profile
- Archives or permanently removes profile
- Cleans up associated browser data
- Removes session storage

---

## 2. Profile Data Model

### 2.1 Core Fields

See `14-parity-matrix.md` Section 2.1 for complete field list.

### 2.2 Computed Fields

#### lastUsedAt
- **Type:** ISO8601 timestamp with timezone
- **Updated on:** Profile session start only
- **Format:** `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Example:** `2026-02-19T03:07:01.991Z`

**Update Triggers:**
- GUI: User clicks "Start" button
- CLI: `node src/index.js scrape --session <profile>`
- API: `POST /api/profile/start/:id`
- Automation: Headless session launch

**Not Updated On:**
- Profile metadata edits
- Profile duplication
- Read-only operations

---

## 3. Group Association

### 3.1 Profile-Group Relationship

- Each profile belongs to exactly one group (1:1)
- Group's profileCount is computed dynamically
- Changing profile group updates both old and new group counts

### 3.2 Group profileCount Calculation

```sql
-- Real-time count query
SELECT COUNT(*) FROM profiles WHERE groupId = ?
```

See `14-parity-matrix.md` Section 3 for complete profileCount documentation.

---

## 4. Tag Association

### 4.1 Profile-Tag Relationship

- Each profile can have multiple tags (many:many)
- Implemented via junction table `profile_tags`
- Tag's profileCount is computed from junction table

### 4.2 Tag profileCount Calculation

```sql
-- Real-time count query
SELECT COUNT(*) FROM profile_tags WHERE tagId = ?
```

---

## 5. Proxy Configuration

### 5.1 Profile-Proxy Relationship

- Each profile can use one proxy (1:1 optional)
- Proxy's profileCount shows how many profiles use it
- Proxy changes are immediate for next session

---

## 6. Session Management

### 6.1 Session Data Storage

- **Cookies:** Stored in SQLite database
- **localStorage:** Stored in JSON files
- **Session Storage:** Not persisted (session-only)

### 6.2 Session Restoration

When starting a profile:
1. Load cookies from database
2. Inject into browser context
3. Load localStorage data
4. Apply to page context

---

## 7. Browser Configuration

### 7.1 Fingerprint Protection

- Custom User-Agent per profile
- WebGL fingerprint randomization
- Canvas fingerprint protection
- Timezone spoofing
- Geolocation override

### 7.2 Anti-Detection Features

- Human-like mouse movements
- Random typing delays
- Viewport randomization
- WebRTC leak protection

---

## 8. Related Documents

- `14-parity-matrix.md` - API & data compatibility
- `03-background-agent.md` - Event handling system
- `04-local-api.md` - API endpoints
- `migration-plan.md` - Database schema

