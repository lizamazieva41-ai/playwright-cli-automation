# Documentation Consistency Testing Guide

## Overview

This document describes how to test the documentation consistency checker to ensure it properly catches errors.

**Last Updated:** 2026-02-19

---

## Positive Test (Current State)

### Expected Result
All checks should PASS with current documentation.

### Command
```bash
npm run docs:check
```

### Expected Output
```
✅ All consistency checks PASSED!
Total Checks: 5
Passed: 15
Failed: 0
Warnings: 0
```

---

## Negative Tests

To verify the checker catches errors, you can temporarily modify `14-parity-matrix.md` and observe the failures.

### Test 1: Endpoint Count Mismatch

**Modify:** Section 5.1 Endpoint Parity Summary table

**Change:**
```markdown
| **TOTAL** | **29** | **0** | **1** | **30** | **96.7%** |
```

**To:**
```markdown
| **TOTAL** | **28** | **0** | **1** | **30** | **93.3%** |
```

**Expected Error:**
```
✗ Endpoint Full mismatch: Table=29, Summary=28
```

**Revert:** Change back to 29 after test

---

### Test 2: Field Count Mismatch

**Modify:** Section 5.2 Data Field Parity Summary table

**Change:**
```markdown
| **TOTAL** | **40** | **0** | **0** | **40** | **100%** |
```

**To:**
```markdown
| **TOTAL** | **39** | **0** | **0** | **40** | **97.5%** |
```

**Expected Error:**
```
✗ Field Full mismatch: Table=40, Summary=39
```

**Revert:** Change back to 40 after test

---

### Test 3: Ambiguous Partial Definition

**Modify:** Section 1.1 Profile Management Endpoints table

**Change one row:**
```markdown
| POST /api/profile/create | ✓ | ✓ | Full | Complete compatibility |
```

**To:**
```markdown
| POST /api/profile/create | ✓ | ✓ | Partial | Complete compatibility |
```

**Expected Error:**
```
✗ Found 1 "Partial" entries in data rows - all should be resolved to Full or N/A
```

**Revert:** Change back to "Full" after test

---

### Test 4: Missing profileCount Documentation

**Modify:** Delete Section 3 (Computed Field: profileCount)

**Expected Error:**
```
✗ profileCount documentation section missing
```

**Revert:** Restore Section 3 from git after test

---

### Test 5: Missing lastUsedAt Documentation

**Modify:** Delete Section 4 (Computed Field: lastUsedAt)

**Expected Error:**
```
✗ lastUsedAt documentation section missing
```

**Revert:** Restore Section 4 from git after test

---

## Full Test Suite

### Run All Negative Tests

```bash
# Backup current file
cp tai-lieu-du-an/docs/14-parity-matrix.md tai-lieu-du-an/docs/14-parity-matrix.md.backup

# Test 1: Change endpoint count
sed -i 's/| \*\*TOTAL\*\* | \*\*29\*\* | \*\*0\*\* | \*\*1\*\* | \*\*30\*\*/| **TOTAL** | **28** | **0** | **1** | **30**/' tai-lieu-du-an/docs/14-parity-matrix.md
npm run docs:check
# Should see: ✗ Endpoint Full mismatch

# Restore
cp tai-lieu-du-an/docs/14-parity-matrix.md.backup tai-lieu-du-an/docs/14-parity-matrix.md

# Verify restoration
npm run docs:check
# Should see: ✅ All consistency checks PASSED!

# Clean up
rm tai-lieu-du-an/docs/14-parity-matrix.md.backup
```

---

## CI/CD Integration

### Pre-commit Hook

Add to `.husky/pre-commit`:
```bash
npm run docs:check
```

This ensures documentation stays consistent before commits.

### GitHub Actions Workflow

```yaml
name: Documentation Quality Check
on: [push, pull_request]
jobs:
  docs-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run docs:check
```

---

## Manual Verification

Beyond automated checks, manually verify:

1. **Count Accuracy**
   - Manually count endpoint rows in each section
   - Compare with section summaries
   - Verify total in Section 5.1

2. **No Ambiguity**
   - Search for "Partial" in data rows (not headers)
   - Verify all have clear definitions or are resolved

3. **Computed Fields**
   - profileCount has calculation queries
   - lastUsedAt has update triggers
   - Both have complete subsections

4. **N/A Documentation**
   - All N/A items reference scope-exceptions.md
   - scope-exceptions.md contains all N/A items

---

## Troubleshooting

### Checker Fails But Documentation Looks Correct

1. Check for extra spaces or formatting issues
2. Verify table column count matches expected (5 for endpoints, 6 for fields)
3. Look for hidden characters or line breaks
4. Re-run with `node --trace-warnings` for more details

### Checker Passes But Should Fail

1. Verify your test modification was saved
2. Check file path is correct
3. Ensure you're testing the right section
4. Review checker code for edge cases

---

## Maintenance

Update this guide when:
- Adding new validation rules to checker
- Changing documentation structure
- Adding new test scenarios
- Updating error messages

**Version:** 1.0  
**Last Test Run:** 2026-02-19  
**Status:** ✅ All Tests Passing

