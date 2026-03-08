/**
 * Unified API Routes using ORDB
 * 
 * This router works with any database through the ORDB interface.
 * No database-specific code here - just business logic!
 */

import express from 'express';

export function createApiRouter(db) {
  const router = express.Router();
  const COLLECTION = 'tasks'; // ← updated from 'posts'

  /**
   * GET /api/tasks
   * Retrieve all tasks, sorted by createdAt ascending
   */
  router.get('/tasks', async (req, res) => {
    try {
      const tasks = await db.findAll(COLLECTION, {}, { sort: { createdAt: 1 } });
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  /**
   * GET /api/tasks/:id
   * Retrieve a single task by ID
   */
  router.get('/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const task = await db.findOne(COLLECTION, { _id: id });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error) {
      console.error('Error fetching task:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  /**
   * POST /api/tasks
   * Create a new task
   */
  router.post('/tasks', async (req, res) => {
    try {
      const { title, date, status } = req.body || {};

      if (!title) {
        return res.status(400).json({ error: 'title is required' });
      }

      const newTask = await db.insertOne(COLLECTION, {
        title,
        date: date || '',
        status: (status && status.trim() !== '') ? status : 'Pending', // ← capital P to match enum
      });

      res.status(201).json(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  /**
   * PUT /api/tasks/:id
   * Update an existing task
   */
  router.put('/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { title, date, status } = req.body || {};

      const update = {};
      if (title !== undefined) update.title = title;
      if (date !== undefined) update.date = date;
      if (status !== undefined) update.status = status;

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
   * DELETE /api/tasks/:id
   * Delete a task by ID
   */
  router.delete('/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await db.deleteOne(COLLECTION, { _id: id });

      if (!deleted) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ ok: true, deletedId: id });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  return router;
}

export default { createApiRouter };