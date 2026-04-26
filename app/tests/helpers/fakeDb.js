function getPathValue(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function setPathValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    if (current[key] == null) {
      current[key] = Number.isInteger(Number(nextKey)) ? [] : {};
    }
    current = current[key];
  }
  current[parts[parts.length - 1]] = value;
}

function matchesFilter(task, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = key.includes('.') ? getPathValue(task, key) : task[key];

    if (key === 'tags' && Array.isArray(task.tags)) {
      return task.tags.includes(expected);
    }

    return actual === expected;
  });
}

function sortTasks(tasks, sort = {}) {
  const sortEntries = Object.entries(sort);
  if (sortEntries.length === 0) return tasks;

  return [...tasks].sort((a, b) => {
    for (const [field, dir] of sortEntries) {
      const av = a[field];
      const bv = b[field];
      if (av === bv) continue;
      if (av == null) return 1;
      if (bv == null) return -1;
      return dir === -1 ? (av < bv ? 1 : -1) : (av > bv ? 1 : -1);
    }
    return 0;
  });
}

export function createFakeDb(seed = {}) {
  let nextTaskId = 1;
  const tasks = (seed.tasks || []).map((t) => ({ ...t }));
  const users = new Map((seed.users || []).map((u) => [u._id, { ...u }]));

  const db = {
    _state: { tasks, users },

    async insertOne(collection, data) {
      if (collection !== 'tasks') throw new Error(`Unsupported collection: ${collection}`);
      const task = {
        _id: String(nextTaskId++),
        createdAt: new Date().toISOString(),
        ...data,
      };
      tasks.push(task);
      return { ...task };
    },

    async findAll(collection, filter = {}, options = {}) {
      if (collection !== 'tasks') throw new Error(`Unsupported collection: ${collection}`);
      const filtered = tasks.filter((task) => matchesFilter(task, filter));
      return sortTasks(filtered, options.sort).map((task) => ({ ...task }));
    },

    async findOne(collection, filter = {}) {
      if (collection !== 'tasks') throw new Error(`Unsupported collection: ${collection}`);
      const task = tasks.find((candidate) => matchesFilter(candidate, filter));
      return task ? { ...task } : null;
    },

    async updateOne(collection, filter = {}, update = {}) {
      if (collection !== 'tasks' && collection !== 'users') {
        throw new Error(`Unsupported collection: ${collection}`);
      }

      if (collection === 'users') {
        const user = users.get(filter._id);
        if (!user) return null;
        for (const [key, value] of Object.entries(update)) {
          setPathValue(user, key, value);
        }
        users.set(user._id, user);
        return { ...user };
      }

      const idx = tasks.findIndex((candidate) => matchesFilter(candidate, filter));
      if (idx < 0) return null;

      for (const [key, value] of Object.entries(update)) {
        if (key.includes('.')) {
          setPathValue(tasks[idx], key, value);
        } else {
          tasks[idx][key] = value;
        }
      }

      return { ...tasks[idx] };
    },

    async deleteOne(collection, filter = {}) {
      if (collection !== 'tasks') throw new Error(`Unsupported collection: ${collection}`);
      const idx = tasks.findIndex((candidate) => matchesFilter(candidate, filter));
      if (idx < 0) return false;
      tasks.splice(idx, 1);
      return true;
    },

    async updateUserTheme(userId, theme) {
      const existing = users.get(userId) || { _id: userId, preferences: {} };
      existing.preferences = existing.preferences || {};
      existing.preferences.theme = theme;
      users.set(userId, existing);
      return { ...existing };
    },
  };

  return db;
}
