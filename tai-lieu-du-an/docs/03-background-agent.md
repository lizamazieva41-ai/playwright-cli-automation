# 03. Background Agent System

## Overview

The Background Agent handles asynchronous operations, event processing, and browser session management for the Windows Desktop Cloud Browser Model.

**Version:** 1.0  
**Last Updated:** 2026-02-19

---

## 1. Agent Architecture

### 1.1 Components

- **Event Queue:** Message queue for async operations
- **Browser Pool:** Manages browser instances
- **Session Manager:** Tracks active sessions
- **Database Writer:** Persists state changes

---

## 2. Event Handling

### 2.1 Profile Events

#### profile.start Event

**Emitted When:**
- User starts profile from GUI
- CLI launches profile session
- API receives POST /api/profile/start/:id
- Automation script starts profile

**Handler Actions:**
1. Validate profile exists and is not already active
2. Load profile configuration from database
3. Update `profiles.lastUsedAt = NOW()` in database
4. Launch browser with stored configuration
5. Inject cookies and localStorage
6. Return session handle to caller

**Database Update:**
```sql
UPDATE profiles 
SET lastUsedAt = NOW(), 
    updatedAt = NOW()
WHERE id = ?
```

**Event Payload:**
```json
{
  "event": "profile.start",
  "profileId": "uuid",
  "timestamp": "2026-02-19T03:07:01.991Z",
  "source": "api|gui|cli"
}
```

#### profile.stop Event

**Emitted When:**
- User stops profile from GUI
- Browser session ends
- API receives POST /api/profile/stop/:id

**Handler Actions:**
1. Close browser instance
2. Save cookies to database
3. Save localStorage to storage
4. Update session status
5. Clean up resources

**Database Update:**
```sql
UPDATE profiles 
SET updatedAt = NOW()
WHERE id = ?
-- Note: lastUsedAt is NOT updated on stop
```

#### profile.update Event

**Emitted When:**
- Profile metadata is edited
- Configuration is changed

**Handler Actions:**
1. Validate changes
2. Update database
3. Does NOT update lastUsedAt
4. Updates updatedAt only

---

## 3. Time Management

### 3.1 Timestamp Standards

All timestamps use ISO 8601 format with UTC timezone:
- **Format:** `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Timezone:** Always UTC (Z suffix)
- **Database:** Stored as TIMESTAMP WITH TIME ZONE
- **API Response:** Serialized as ISO 8601 string

### 3.2 lastUsedAt Update Logic

```javascript
// Pseudo-code for lastUsedAt update
async function handleProfileStart(profileId, source) {
  const now = new Date().toISOString(); // e.g., "2026-02-19T03:07:01.991Z"
  
  await db.query(`
    UPDATE profiles 
    SET lastUsedAt = $1,
        updatedAt = $1
    WHERE id = $2
  `, [now, profileId]);
  
  // Continue with browser launch...
}
```

### 3.3 Headless/Automation Sessions

lastUsedAt is updated for ALL session types:
- ✅ GUI-launched sessions
- ✅ CLI-launched sessions  
- ✅ API-triggered sessions
- ✅ Headless automation
- ✅ Background/scheduled tasks

**No exceptions** - every session start updates lastUsedAt.

---

## 4. Browser Session Management

### 4.1 Session Lifecycle

1. **Request:** Receive profile.start event
2. **Validate:** Check profile exists and not active
3. **Update DB:** Set lastUsedAt timestamp
4. **Launch:** Create browser instance
5. **Configure:** Apply profile settings
6. **Inject:** Load cookies and localStorage
7. **Ready:** Return session handle
8. **Monitor:** Track session activity
9. **Close:** Handle browser close event
10. **Cleanup:** Save state and release resources

---

## 5. Event Queue Processing

### 5.1 Queue Implementation

- **Technology:** In-memory queue with persistence fallback
- **Concurrency:** Configurable worker pool
- **Ordering:** FIFO for same profile, parallel for different profiles

### 5.2 Error Handling

- Failed events are retried with exponential backoff
- Max 3 retry attempts
- Dead-letter queue for persistent failures
- Error notifications for critical failures

---

## 6. Performance Considerations

### 6.1 Database Optimization

- Index on `profiles.lastUsedAt` for quick sorting
- Index on `profiles.groupId` for profileCount queries
- Batch updates when possible

### 6.2 Browser Pool Management

- Reuse browser instances when possible
- Maximum concurrent sessions configurable
- Automatic cleanup of idle browsers

---

## 7. Related Documents

- `02-he-thong-profile.md` - Profile lifecycle
- `14-parity-matrix.md` - lastUsedAt field definition
- `migration-plan.md` - Database schema

