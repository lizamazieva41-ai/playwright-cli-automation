#!/usr/bin/env node
/**
 * Documentation Consistency Checker
 * 
 * Validates that summary statistics in documentation match actual table data
 * Prevents documentation drift and ensures accuracy
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class DocConsistencyChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = 0;
    this.passed = 0;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  error(message) {
    this.errors.push(message);
    this.log(`  ✗ ${message}`, 'red');
  }

  success(message) {
    this.passed++;
    this.log(`  ✓ ${message}`, 'green');
  }

  warning(message) {
    this.warnings.push(message);
    this.log(`  ⚠ ${message}`, 'yellow');
  }

  /**
   * Parse parity matrix markdown file
   */
  parseParityMatrix(filePath) {
    if (!fs.existsSync(filePath)) {
      this.error(`File not found: ${filePath}`);
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const data = {
      endpoints: {
        profile: { full: 0, partial: 0, na: 0 },
        group: { full: 0, partial: 0, na: 0 },
        tag: { full: 0, partial: 0, na: 0 },
        proxy: { full: 0, partial: 0, na: 0 },
        environment: { full: 0, partial: 0, na: 0 }
      },
      fields: {
        profile: { full: 0, partial: 0, na: 0 },
        group: { full: 0, partial: 0, na: 0 },
        tag: { full: 0, partial: 0, na: 0 },
        proxy: { full: 0, partial: 0, na: 0 }
      },
      summary: {
        endpoints: { full: 0, partial: 0, na: 0, total: 0 },
        fields: { full: 0, partial: 0, na: 0, total: 0 }
      }
    };

    // Parse endpoint tables
    this.parseEndpointTable(content, '1.1 Profile Management', data.endpoints.profile);
    this.parseEndpointTable(content, '1.2 Group Management', data.endpoints.group);
    this.parseEndpointTable(content, '1.3 Tag Management', data.endpoints.tag);
    this.parseEndpointTable(content, '1.4 Proxy Management', data.endpoints.proxy);
    this.parseEndpointTable(content, '1.5 Environment & System', data.endpoints.environment);

    // Parse field tables
    this.parseFieldTable(content, '2.1 Profile Data Model', data.fields.profile);
    this.parseFieldTable(content, '2.2 Group Data Model', data.fields.group);
    this.parseFieldTable(content, '2.3 Tag Data Model', data.fields.tag);
    this.parseFieldTable(content, '2.4 Proxy Data Model', data.fields.proxy);

    // Parse summary section
    this.parseSummarySection(content, data.summary);

    return data;
  }

  parseEndpointTable(content, sectionTitle, stats) {
    const sectionRegex = new RegExp(`###\\s+${sectionTitle}[\\s\\S]*?(?=###|##|$)`);
    const section = content.match(sectionRegex);
    
    if (!section) {
      this.warning(`Section not found: ${sectionTitle}`);
      return;
    }

    const tableRows = section[0].match(/^\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|.*$/gm);
    if (!tableRows) return;

    // Skip first row (header) and find data rows
    // Look for rows that contain endpoint paths (start with GET, POST, PUT, DELETE)
    const dataRows = tableRows.filter(row => 
      /^\|\s*(GET|POST|PUT|DELETE)/.test(row)
    );
    
    for (const row of dataRows) {
      const cells = row.split('|').map(c => c.trim()).filter(c => c !== '');
      const status = cells[3]; // After filtering empty cells: endpoint, morelogin, local, status, notes
      
      if (status === 'Full') stats.full++;
      else if (status === 'Partial') stats.partial++;
      else if (status === 'N/A') stats.na++;
    }
  }

  parseFieldTable(content, sectionTitle, stats) {
    const sectionRegex = new RegExp(`###\\s+${sectionTitle}[\\s\\S]*?(?=###|##|$)`);
    const section = content.match(sectionRegex);
    
    if (!section) {
      this.warning(`Section not found: ${sectionTitle}`);
      return;
    }

    const tableRows = section[0].match(/^\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|.*$/gm);
    if (!tableRows) return;

    // Skip first row (header) and filter for data rows
    // Data rows should have field names (not "Field" header, not "---" separator)
    const dataRows = tableRows.filter(row => 
      !/^\|\s*Field\s*\|/.test(row) && 
      !/^\|\s*-+\s*\|/.test(row) &&
      row.includes('✓')  // Data rows have checkmarks
    );
    
    for (const row of dataRows) {
      const cells = row.split('|').map(c => c.trim()).filter(c => c !== '');
      const status = cells[3]; // After filtering: field, morelogin, local, status, type, notes
      
      if (status === 'Full') stats.full++;
      else if (status === 'Partial') stats.partial++;
      else if (status === 'N/A') stats.na++;
    }
  }

  parseSummarySection(content, summary) {
    // Parse endpoint summary table
    const endpointSummaryRegex = /###\s+5\.1[^\n]*\n[\s\S]*?\|\s+\*\*TOTAL\*\*\s+\|\s+\*\*(\d+)\*\*\s+\|\s+\*\*(\d+)\*\*\s+\|\s+\*\*(\d+)\*\*\s+\|\s+\*\*(\d+)\*\*/;
    const endpointMatch = content.match(endpointSummaryRegex);
    
    if (endpointMatch) {
      summary.endpoints.full = parseInt(endpointMatch[1]);
      summary.endpoints.partial = parseInt(endpointMatch[2]);
      summary.endpoints.na = parseInt(endpointMatch[3]);
      summary.endpoints.total = parseInt(endpointMatch[4]);
    }

    // Parse field summary table
    const fieldSummaryRegex = /###\s+5\.2[^\n]*\n[\s\S]*?\|\s+\*\*TOTAL\*\*\s+\|\s+\*\*(\d+)\*\*\s+\|\s+\*\*(\d+)\*\*\s+\|\s+\*\*(\d+)\*\*\s+\|\s+\*\*(\d+)\*\*/;
    const fieldMatch = content.match(fieldSummaryRegex);
    
    if (fieldMatch) {
      summary.fields.full = parseInt(fieldMatch[1]);
      summary.fields.partial = parseInt(fieldMatch[2]);
      summary.fields.na = parseInt(fieldMatch[3]);
      summary.fields.total = parseInt(fieldMatch[4]);
    }
  }

  checkEndpointParity(data) {
    this.log('\n📊 Checking Endpoint Parity...', 'cyan');
    this.checks++;

    // Calculate actual totals from tables
    const actual = {
      full: 0,
      partial: 0,
      na: 0,
      total: 0
    };

    for (const category of Object.values(data.endpoints)) {
      actual.full += category.full;
      actual.partial += category.partial;
      actual.na += category.na;
    }
    actual.total = actual.full + actual.partial + actual.na;

    // Compare with summary
    const summary = data.summary.endpoints;

    if (actual.full !== summary.full) {
      this.error(`Endpoint Full mismatch: Table=${actual.full}, Summary=${summary.full}`);
    } else {
      this.success(`Endpoint Full count correct: ${actual.full}`);
    }

    if (actual.partial !== summary.partial) {
      this.error(`Endpoint Partial mismatch: Table=${actual.partial}, Summary=${summary.partial}`);
    } else {
      this.success(`Endpoint Partial count correct: ${actual.partial}`);
    }

    if (actual.na !== summary.na) {
      this.error(`Endpoint N/A mismatch: Table=${actual.na}, Summary=${summary.na}`);
    } else {
      this.success(`Endpoint N/A count correct: ${actual.na}`);
    }

    if (actual.total !== summary.total) {
      this.error(`Endpoint Total mismatch: Table=${actual.total}, Summary=${summary.total}`);
    } else {
      this.success(`Endpoint Total count correct: ${actual.total}`);
    }
  }

  checkFieldParity(data) {
    this.log('\n📊 Checking Field Parity...', 'cyan');
    this.checks++;

    // Calculate actual totals from tables
    const actual = {
      full: 0,
      partial: 0,
      na: 0,
      total: 0
    };

    for (const category of Object.values(data.fields)) {
      actual.full += category.full;
      actual.partial += category.partial;
      actual.na += category.na;
    }
    actual.total = actual.full + actual.partial + actual.na;

    // Compare with summary
    const summary = data.summary.fields;

    if (actual.full !== summary.full) {
      this.error(`Field Full mismatch: Table=${actual.full}, Summary=${summary.full}`);
    } else {
      this.success(`Field Full count correct: ${actual.full}`);
    }

    if (actual.partial !== summary.partial) {
      this.error(`Field Partial mismatch: Table=${actual.partial}, Summary=${summary.partial}`);
    } else {
      this.success(`Field Partial count correct: ${actual.partial}`);
    }

    if (actual.na !== summary.na) {
      this.error(`Field N/A mismatch: Table=${actual.na}, Summary=${summary.na}`);
    } else {
      this.success(`Field N/A count correct: ${actual.na}`);
    }

    if (actual.total !== summary.total) {
      this.error(`Field Total mismatch: Table=${actual.total}, Summary=${summary.total}`);
    } else {
      this.success(`Field Total count correct: ${actual.total}`);
    }
  }

  checkPartialDefinitions(filePath) {
    this.log('\n🔍 Checking for Ambiguous Partial Definitions...', 'cyan');
    this.checks++;

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for "Partial" status in data rows only (rows with checkmarks indicating actual data)
    // Split into lines and check each line
    const lines = content.split('\n');
    let partialCount = 0;
    
    for (const line of lines) {
      // Look for table rows with checkmarks (data rows) that have Partial status
      if (line.includes('✓') && /\|\s+Partial\s+\|/.test(line)) {
        partialCount++;
      }
    }
    
    if (partialCount > 0) {
      this.error(`Found ${partialCount} "Partial" entries in data rows - all should be resolved to Full or N/A`);
    } else {
      this.success('No ambiguous Partial definitions found in data rows');
    }
  }

  checkComputedFieldDocumentation(filePath) {
    this.log('\n📝 Checking Computed Field Documentation...', 'cyan');
    this.checks++;

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for profileCount section
    const hasProfileCount = content.includes('## 3. Computed Field: profileCount');
    if (hasProfileCount) {
      this.success('profileCount documentation section exists');
      
      // Check for key subsections
      const hasCalculation = content.includes('### 3.2 Calculation Method');
      const hasCaching = content.includes('### 3.3 Caching Strategy');
      const hasUpdate = content.includes('### 3.4 Update Behavior');
      
      if (hasCalculation && hasCaching && hasUpdate) {
        this.success('profileCount has complete documentation');
      } else {
        this.error('profileCount documentation is incomplete');
      }
    } else {
      this.error('profileCount documentation section missing');
    }

    // Check for lastUsedAt section
    const hasLastUsedAt = content.includes('## 4. Computed Field: lastUsedAt');
    if (hasLastUsedAt) {
      this.success('lastUsedAt documentation section exists');
      
      // Check for key subsections
      const hasUpdateTrigger = content.includes('### 4.2 Update Trigger Events');
      const hasTimeFormat = content.includes('### 4.3 Time Format');
      const hasHeadless = content.includes('### 4.4 Headless/Automation Behavior');
      
      if (hasUpdateTrigger && hasTimeFormat && hasHeadless) {
        this.success('lastUsedAt has complete documentation');
      } else {
        this.error('lastUsedAt documentation is incomplete');
      }
    } else {
      this.error('lastUsedAt documentation section missing');
    }
  }

  checkScopeExceptions(parityPath, exceptionsPath) {
    this.log('\n🚫 Checking Scope Exceptions...', 'cyan');
    this.checks++;

    if (!fs.existsSync(exceptionsPath)) {
      this.error(`Scope exceptions file not found: ${exceptionsPath}`);
      return;
    }

    const parityContent = fs.readFileSync(parityPath, 'utf8');
    const exceptionsContent = fs.readFileSync(exceptionsPath, 'utf8');

    // Check if N/A items in parity reference exceptions document
    const naItems = parityContent.match(/\|\s+N\/A\s+\|/g);
    
    if (naItems && naItems.length > 0) {
      if (parityContent.includes('scope-exceptions.md')) {
        this.success(`N/A items reference scope-exceptions.md`);
      } else {
        this.warning('N/A items found but scope-exceptions.md not referenced');
      }
      
      // Check if cleanCloud endpoint is documented in exceptions
      if (exceptionsContent.includes('/api/env/cache/cleanCloud')) {
        this.success('cleanCloud endpoint documented in exceptions');
      } else {
        this.error('cleanCloud endpoint not found in exceptions document');
      }
    } else {
      this.success('No N/A items or all properly documented');
    }
  }

  run() {
    this.log('='.repeat(70), 'blue');
    this.log('📋 Documentation Consistency Checker', 'blue');
    this.log('='.repeat(70), 'blue');

    const docsDir = path.join(__dirname, '../../docs');
    const parityPath = path.join(docsDir, '14-parity-matrix.md');
    const exceptionsPath = path.join(docsDir, 'scope-exceptions.md');

    // Parse parity matrix
    const data = this.parseParityMatrix(parityPath);
    
    if (!data) {
      this.log('\n❌ Failed to parse parity matrix', 'red');
      return 1;
    }

    // Run all checks
    this.checkEndpointParity(data);
    this.checkFieldParity(data);
    this.checkPartialDefinitions(parityPath);
    this.checkComputedFieldDocumentation(parityPath);
    this.checkScopeExceptions(parityPath, exceptionsPath);

    // Print summary
    this.log('\n' + '='.repeat(70), 'blue');
    this.log('📊 Summary', 'blue');
    this.log('='.repeat(70), 'blue');
    
    this.log(`Total Checks: ${this.checks}`);
    this.log(`Passed: ${this.passed}`, this.errors.length === 0 ? 'green' : 'yellow');
    this.log(`Failed: ${this.errors.length}`, this.errors.length === 0 ? 'green' : 'red');
    this.log(`Warnings: ${this.warnings.length}`, this.warnings.length === 0 ? 'green' : 'yellow');

    if (this.errors.length === 0) {
      this.log('\n✅ All consistency checks PASSED!', 'green');
      return 0;
    } else {
      this.log('\n❌ Consistency checks FAILED!', 'red');
      this.log('\nErrors:', 'red');
      this.errors.forEach(err => this.log(`  - ${err}`, 'red'));
      return 1;
    }
  }
}

// Main execution
if (require.main === module) {
  const checker = new DocConsistencyChecker();
  const exitCode = checker.run();
  process.exit(exitCode);
}

module.exports = DocConsistencyChecker;
