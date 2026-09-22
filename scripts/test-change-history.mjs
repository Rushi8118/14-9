import assert from 'node:assert/strict'
import {
  computeDetailedChanges,
  formatDiffValue,
  getFieldLabel,
  isSensitiveField,
} from '../src/lib/diff-utils.js'

console.log('=== RUNNING ACTIVITY LOGS CHANGE HISTORY TESTS ===\n')

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    console.log(`✅ [PASS] ${name}`)
    passed++
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`)
    console.error(err)
    failed++
  }
}

// Test Case 1: One field changed
test('Case 1: One field changed', () => {
  const original = {
    name: 'India',
    avg_processing_days: 15,
    is_active: true,
  }
  const submitted = {
    name: 'Canada',
    avg_processing_days: 15,
    is_active: true,
  }

  const result = computeDetailedChanges(original, submitted, 'Updated', {
    tableName: 'countries',
    recordId: 'rec-1',
  })

  assert.equal(result.changes.length, 1, 'Should record exactly 1 changed field')
  assert.equal(result.changes[0].field, 'name')
  assert.equal(result.changes[0].field_name, 'Country name')
  assert.equal(result.changes[0].old_value, 'India')
  assert.equal(result.changes[0].new_value, 'Canada')
  assert.equal(result.hasChanges, true)
})

// Test Case 2: Multiple fields changed
test('Case 2: Multiple fields changed', () => {
  const original = {
    name: 'India',
    avg_processing_days: 15,
    is_active: true,
  }
  const submitted = {
    name: 'Canada',
    avg_processing_days: 20,
    is_active: false,
  }

  const result = computeDetailedChanges(original, submitted, 'Updated', {
    tableName: 'countries',
    recordId: 'rec-2',
  })

  assert.equal(result.changes.length, 3, 'Should record all 3 changed fields in same log entry')
  
  const nameChange = result.changes.find((c) => c.field === 'name')
  assert.ok(nameChange)
  assert.equal(nameChange.field_name, 'Country name')
  assert.equal(nameChange.old_value, 'India')
  assert.equal(nameChange.new_value, 'Canada')

  const timeChange = result.changes.find((c) => c.field === 'avg_processing_days')
  assert.ok(timeChange)
  assert.equal(timeChange.field_name, 'Average processing time')
  assert.equal(timeChange.old_value, '15 days')
  assert.equal(timeChange.new_value, '20 days')

  const statusChange = result.changes.find((c) => c.field === 'is_active')
  assert.ok(statusChange)
  assert.equal(statusChange.field_name, 'Status')
  assert.equal(statusChange.old_value, 'Active')
  assert.equal(statusChange.new_value, 'Inactive')
})

// Test Case 3: No fields changed
test('Case 3: No fields changed', () => {
  const original = {
    name: 'Germany',
    avg_processing_days: 30,
    is_active: true,
  }
  const submitted = {
    name: 'Germany',
    avg_processing_days: 30,
    is_active: true,
  }

  const result = computeDetailedChanges(original, submitted, 'Updated', {
    tableName: 'countries',
    recordId: 'rec-3',
  })

  assert.equal(result.changes.length, 0, 'Should have 0 changes when values are identical')
  assert.equal(result.hasChanges, false)
  assert.equal(result.summary, 'No values changed')
})

// Test Case 4: A value changed from empty to a value
test('Case 4: A value changed from empty to a value', () => {
  const original = {
    name: 'Japan',
    capital: null,
    description: '',
  }
  const submitted = {
    name: 'Japan',
    capital: 'Tokyo',
    description: 'Island nation in East Asia',
  }

  const result = computeDetailedChanges(original, submitted, 'Updated', {
    tableName: 'countries',
    recordId: 'rec-4',
  })

  const capitalChange = result.changes.find((c) => c.field === 'capital')
  assert.ok(capitalChange)
  assert.equal(capitalChange.field_name, 'Capital City')
  assert.equal(capitalChange.old_value, '—', 'Empty original value must display as —')
  assert.equal(capitalChange.new_value, 'Tokyo')

  const descChange = result.changes.find((c) => c.field === 'description')
  assert.ok(descChange)
  assert.equal(descChange.old_value, '—', 'Empty string must display as —')
  assert.equal(descChange.new_value, 'Island nation in East Asia')
})

// Test Case 5: A value changed from a value to empty
test('Case 5: A value changed from a value to empty', () => {
  const original = {
    name: 'Australia',
    capital: 'Canberra',
  }
  const submitted = {
    name: 'Australia',
    capital: '',
  }

  const result = computeDetailedChanges(original, submitted, 'Updated', {
    tableName: 'countries',
    recordId: 'rec-5',
  })

  assert.equal(result.changes.length, 1)
  assert.equal(result.changes[0].field, 'capital')
  assert.equal(result.changes[0].old_value, 'Canberra')
  assert.equal(result.changes[0].new_value, '—', 'Cleared value must display as —')
})

// Test Case 6: A new record created
test('Case 6: A new record created', () => {
  const submitted = {
    name: 'United Kingdom',
    code: 'GB',
    capital: 'London',
    is_active: true,
  }

  const result = computeDetailedChanges(null, submitted, 'Created', {
    tableName: 'countries',
    recordId: 'rec-6',
  })

  assert.ok(result.changes.length >= 4, 'Should record all fields for created record')
  assert.equal(result.action_type, 'Created')
  for (const change of result.changes) {
    assert.equal(change.old_value, '—', 'Created record old_value must be —')
    assert.notEqual(change.new_value, '—', 'Created record new_value must be populated')
  }

  const nameChange = result.changes.find((c) => c.field === 'name')
  assert.equal(nameChange.new_value, 'United Kingdom')
})

// Test Case 7: A record deleted
test('Case 7: A record deleted', () => {
  const original = {
    name: 'France',
    code: 'FR',
    capital: 'Paris',
    is_active: true,
  }

  const result = computeDetailedChanges(original, null, 'Deleted', {
    tableName: 'countries',
    recordId: 'rec-7',
  })

  assert.ok(result.changes.length >= 4, 'Should record all fields for deleted record')
  assert.equal(result.action_type, 'Deleted')
  for (const change of result.changes) {
    assert.notEqual(change.old_value, '—', 'Deleted record old_value must be populated')
    assert.equal(change.new_value, '—', 'Deleted record new_value must be —')
  }

  const nameChange = result.changes.find((c) => c.field === 'name')
  assert.equal(nameChange.old_value, 'France')
})

// Test Case 8: Security - Sensitive fields must NEVER be stored
test('Security: Sensitive fields (password, token, secret, api_key) are never logged', () => {
  const original = {
    name: 'Admin',
    password: 'old_password_123',
    secret_token: 'tok_abc123',
    api_key: 'key_xyz789',
    cvv: '123',
  }
  const submitted = {
    name: 'Super Admin',
    password: 'new_password_456',
    secret_token: 'tok_def456',
    api_key: 'key_uvw000',
    cvv: '999',
  }

  const result = computeDetailedChanges(original, submitted, 'Updated', {
    tableName: 'users',
    recordId: 'u-1',
  })

  assert.equal(result.changes.length, 1, 'Only non-sensitive field (name) should be recorded')
  assert.equal(result.changes[0].field, 'name')
  assert.ok(!JSON.stringify(result).includes('password_'), 'Password must never leak in payload')
  assert.ok(!JSON.stringify(result).includes('tok_'), 'Token must never leak in payload')
  assert.ok(!JSON.stringify(result).includes('key_'), 'API key must never leak in payload')
})

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`)
if (failed > 0) process.exit(1)
