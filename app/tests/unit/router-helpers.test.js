import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { parseTaskBody } from '../../routes/api.js';
import { parseSubtasks, normalizeTags } from '../../routes/router.js';

describe('router helpers', () => {
  it('parseTaskBody returns error when title is required but missing', () => {
    const result = parseTaskBody({}, true);
    assert.equal(result.error, 'title is required');
    assert.equal(result.data, null);
  });

  it('parseTaskBody normalizes status and priority', () => {
    const result = parseTaskBody({ title: 'Task', status: '   ', priority: '2' }, true);
    assert.equal(result.error, null);
    assert.deepEqual(result.data, { title: 'Task', status: 'Pending', priority: 2 });
  });

  it('parseTaskBody forces non-array subtasks to empty array', () => {
    const result = parseTaskBody({ subtasks: { bad: true } });
    assert.deepEqual(result.data, { subtasks: [] });
  });

  it('parseSubtasks returns empty array when no subtasks are provided', () => {
    assert.deepEqual(parseSubtasks(undefined), []);
  });

  it('parseSubtasks maps completed values when withCompleted is true', () => {
    const subtasks = {
      a: { title: 'One', completed: 'true' },
      b: { title: 'Two', completed: false },
    };
    assert.deepEqual(parseSubtasks(subtasks, true), [
      { title: 'One', completed: true },
      { title: 'Two', completed: false },
    ]);
  });

  it('normalizeTags trims, deduplicates, and preserves first casing', () => {
    const tags = normalizeTags(' Work,home,work,  HOME ');
    assert.deepEqual(tags, ['Work', 'home']);
  });

  it('normalizeTags truncates to 30 chars and supports arrays', () => {
    const tags = normalizeTags(['abcdefghijklmnopqrstuvwxyz123456', 'ok']);
    assert.equal(tags[0].length, 30);
    assert.equal(tags[1], 'ok');
  });
});
