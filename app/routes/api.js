/**
 * Unified API Routes using ORDB
 */

import express from 'express';

export function createApiRouter(db) {
  const router = express.Router();
  const COLLECTION = 'tasks';

  /**
   * GET /api/tasks
   */
  router.get('/tasks', async (req, res) => {
    try {
      // Sorting by Priority (1-Critical first) then by Date
      const tasks = await db.findAll(COLLECTION, {}, { sort: { priority: 1, createdAt: 1 } });
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  /**
   * POST /api/tasks
   * Create a new task with priority and subtasks
   */
  router.post('/tasks', async (req, res) => {
    try {
      const { title, date, status, priority, subtasks } = req.body || {};

      if (!title) {
        return res.status(400).json({ error: 'title is required' });
      }

      const newTask = await db.insertOne(COLLECTION, {
        title,
        date: date || null,
        status: (status && status.trim() !== '') ? status : 'Pending',
        priority: priority ? parseInt(priority) : 3, // Default to Medium (3)
        subtasks: Array.isArray(subtasks) ? subtasks : [] // Expecting array from JSON
      });

      res.status(201).json(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  /**
   * PUT /api/tasks/:id
   * Update an existing task including subtasks and priority
   */
  router.put('/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, date, status, priority, subtasks } = req.body || {};

      const update = {};
      if (title !== undefined) update.title = title;
      if (date !== undefined) update.date = date || null;
      if (status !== undefined) update.status = status;
      if (priority !== undefined) update.priority = parseInt(priority);
      if (subtasks !== undefined) update.subtasks = Array.isArray(subtasks) ? subtasks : [];

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const updatedTask = await db.updateOne(
        COLLECTION,
        { _id: id },
        update
      );

      if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  /**
   * DELETE /api/tasks/:id (Remains unchanged)
   */
  router.delete('/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await db.deleteOne(COLLECTION, { _id: id });
      if (!deleted) return res.status(404).json({ error: 'Task not found' });
      res.json({ ok: true, deletedId: id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  return router;
}

export default { createApiRouter };