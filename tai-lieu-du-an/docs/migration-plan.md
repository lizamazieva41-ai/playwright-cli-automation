# Database Migration Plan

## Overview

This document defines the database schema for the Windows Desktop Cloud Browser Model local implementation.

**Version:** 1.0  
**Last Updated:** 2026-02-19

---

## 1. Database Technology

- **Primary Database:** SQLite 3 (for local storage)
- **Alternative:** PostgreSQL (for server deployments)
- **ORM:** Sequelize or TypeORM (TBD)

---

## 2. Schema Definition

### 2.1 Profiles Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  groupId UUID REFERENCES groups(id) ON DELETE SET NULL,
  proxyId UUID REFERENCES proxies(id) ON DELETE SET NULL,
  browserType VARCHAR(50) DEFAULT 'firefox',
  userAgent TEXT,
  webgl JSONB,
  canvas JSONB,
  timezone VARCHAR(100),
  locale VARCHAR(10),
  geolocation JSONB,
  cookies JSONB,
  localStorage JSONB,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL,
  lastUsedAt TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_profiles_groupId (groupId),
  INDEX idx_profiles_proxyId (proxyId),
  INDEX idx_profiles_lastUsedAt (lastUsedAt),
  INDEX idx_profiles_createdAt (createdAt)
);
```

**Field Notes:**
- `lastUsedAt`: Nullable, updated only on session start (see `03-background-agent.md`)
- `createdAt`: Set once on creation, never modified
- `updatedAt`: Updated on any profile modification
- Indexes on foreign keys for profileCount queries

### 2.2 Groups Table

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color: #RRGGBB
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL,
  
  UNIQUE INDEX idx_groups_name (name)
);
```

**Computed Fields:**
- `profileCount`: Not stored, computed via `SELECT COUNT(*) FROM profiles WHERE groupId = ?`

### 2.3 Tags Table

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7), -- Hex color: #RRGGBB
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL,
  
  UNIQUE INDEX idx_tags_name (name)
);
```

**Computed Fields:**
- `profileCount`: Not stored, computed via junction table

### 2.4 Profile_Tags Junction Table

```sql
CREATE TABLE profile_tags (
  profileId UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tagId UUID REFERENCES tags(id) ON DELETE CASCADE,
  assignedAt TIMESTAMP WITH TIME ZONE NOT NULL,
  
  PRIMARY KEY (profileId, tagId),
  INDEX idx_profile_tags_tagId (tagId)
);
```

Used for computing Tag.profileCount:
```sql
SELECT COUNT(*) FROM profile_tags WHERE tagId = ?
```

### 2.5 Proxies Table

```sql
CREATE TABLE proxies (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'http', 'https', 'socks5'
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL,
  username VARCHAR(255),
  password VARCHAR(255),
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  updatedAt TIMESTAMP WITH TIME ZONE NOT NULL,
  
  INDEX idx_proxies_host_port (host, port)
);
```

**Computed Fields:**
- `profileCount`: Not stored, computed via `SELECT COUNT(*) FROM profiles WHERE proxyId = ?`

---

## 3. Computed Field Queries

### 3.1 Group.profileCount

```sql
-- Real-time query (no caching)
SELECT COUNT(*) as profileCount 
FROM profiles 
WHERE groupId = :groupId;

-- With group details
SELECT g.*, 
       (SELECT COUNT(*) FROM profiles WHERE groupId = g.id) as profileCount
FROM groups g
WHERE g.id = :groupId;
```

### 3.2 Tag.profileCount

```sql
-- Real-time query via junction table
SELECT COUNT(*) as profileCount 
FROM profile_tags 
WHERE tagId = :tagId;

-- With tag details
SELECT t.*, 
       (SELECT COUNT(*) FROM profile_tags WHERE tagId = t.id) as profileCount
FROM tags t
WHERE t.id = :tagId;
```

### 3.3 Proxy.profileCount

```sql
-- Real-time query
SELECT COUNT(*) as profileCount 
FROM profiles 
WHERE proxyId = :proxyId;

-- With proxy details
SELECT p.*, 
       (SELECT COUNT(*) FROM profiles WHERE proxyId = p.id) as profileCount
FROM proxies p
WHERE p.id = :proxyId;
```

**Performance:** All queries use indexed foreign keys for fast counting.

---

## 4. Migration Strategy

### 4.1 Initial Setup

```bash
# Create database and tables
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed
```

### 4.2 Version Control

Migrations tracked in `migrations/` directory:
- `001_initial_schema.sql`
- `002_add_indexes.sql`
- Future migrations as needed

---

## 5. Data Integrity

### 5.1 Constraints

- Foreign keys with appropriate CASCADE/SET NULL rules
- NOT NULL constraints on required fields
- UNIQUE constraints on unique identifiers

### 5.2 Triggers (if needed)

Currently no triggers planned. All computed fields are query-time calculations.

---

## 6. Backup & Recovery

### 6.1 SQLite Backup

```bash
# Manual backup
cp data/database.sqlite data/backups/database_$(date +%Y%m%d).sqlite

# Automated daily backup (cron job)
0 2 * * * /path/to/backup-script.sh
```

---

## 7. Related Documents

- `14-parity-matrix.md` - Data model parity and field definitions
- `02-he-thong-profile.md` - Profile management system
- `03-background-agent.md` - Event handling and updates
- `04-local-api.md` - API that uses this schema

