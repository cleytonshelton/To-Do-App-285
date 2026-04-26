import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildWhere, serialize, deserializeRow } from '../../db/sqlite_adapter.js';

describe('sqlite adapter helpers', () => {
  it('buildWhere returns empty clause when filter is empty', () => {
    const result = buildWhere();
    assert.deepEqual(result, { clause: '', values: [] });
  });

  it('buildWhere builds a parameterized AND clause', () => {
    const result = buildWhere({ ownerId: 'u1', status: 'Pending' });
    assert.equal(result.clause, 'WHERE ownerId = ? AND status = ?');
    assert.deepEqual(result.values, ['u1', 'Pending']);
  });

  it('serialize json-encodes arrays and objects', () => {
    assert.equal(serialize(['a', 'b']), '["a","b"]');
    assert.equal(serialize({ k: 1 }), '{"k":1}');
  });

  it('serialize keeps primitive values unchanged', () => {
    assert.equal(serialize('hello'), 'hello');
    assert.equal(serialize(2), 2);
  });

  it('deserializeRow parses json-looking strings', () => {
    const row = deserializeRow({ subtasks: '[{"title":"x"}]', priority: 1 });
    assert.deepEqual(row, { subtasks: [{ title: 'x' }], priority: 1 });
  });

  it('deserializeRow keeps non-json strings and handles null', () => {
    assert.equal(deserializeRow(null), null);
    const row = deserializeRow({ status: 'Pending' });
    assert.deepEqual(row, { status: 'Pending' });
  });
});
