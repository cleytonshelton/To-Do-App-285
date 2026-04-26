/**
 * API Routes - Express Router for Task and User Operations
 *
 * Handles all task-related and user-setting API endpoints.
 * Works with any database through the ORDB abstraction layer.
 */

import express from 'express';
import { requireAuth } from '../db/middleware/authMiddleware.js';

const COLLECTION = 'tasks';

/**
 * Normalizes a task payload from a request body.
 */
export function parseTaskBody(body = {}, requireTitle = false) {
  const { title, date, status, priority, subtasks } = body;

  if (requireTitle && !title?.trim()) {
    return { data: null, error: 'title is required' };
  }

  return {
    error: null,
    data: {
      ...(title     !== undefined && { title }),
      ...(date      !== undefined && { date: date || null }),
      ...(status    !== undefined && { status: status?.trim() || 'Pending' }),
      ...(priority  !== undefined && { priority: parseInt(priority) }),
      ...(subtasks  !== undefined && { subtasks: Array.isArray(subtasks) ? subtasks : [] }),
    },
  };
}

/**
 * Creates and configures the API router.
 */
export function createApiRouter(db, deps = {}) {
  const router = express.Router();
  const requireAuthMiddleware = deps.requireAuthMiddleware || requireAuth;

  // Apply requireAuth to ALL API routes below
  router.use(requireAuthMiddleware);

  // ─── Tasks: Create ─────────────────────────────────────────────────────────

  router.post('/tasks', async (req, res) => {
    const { data, error } = parseTaskBody(req.body, true);
    if (error) return res.status(400).json({ error });

    try {
      const task = await db.insertOne(COLLECTION, {
        ...data,
        ownerId: req.user._id, 
      });
      res.status(201).json(task);
    } catch (err) {
      console.error('Error creating task:', err);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // ─── Tasks: Read ───────────────────────────────────────────────────────────

  router.get('/tasks', async (req, res) => {
    try {
      const tasks = await db.findAll(
        COLLECTION, 
        { ownerId: req.user._id }, 
        { sort: { priority: 1, createdAt: 1 } }
      );
      res.json(tasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  router.get('/tasks/:id', async (req, res) => {
    try {
      const task = await db.findOne(COLLECTION, { _id: req.params.id, ownerId: req.user._id });
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json(task);
    } catch (err) {
      console.error('Error fetching task:', err);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  // ─── Tasks: Update ─────────────────────────────────────────────────────────

  router.put('/tasks/:id', async (req, res) => {
    const { data, error } = parseTaskBody(req.body);
    if (error) return res.status(400).json({ error });

    try {
      const task = await db.updateOne(
        COLLECTION, 
        { _id: req.params.id, ownerId: req.user._id }, 
        data
      );
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json(task);
    } catch (err) {
      console.error('Error updating task:', err);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  router.put('/tasks/:id/subtasks/:index', async (req, res) => {
    const { id, index } = req.params;
    const completed = req.body.completed === 'true' || req.body.completed === true;

    try {
      const task = await db.updateOne(
        COLLECTION,
        { _id: id, ownerId: req.user._id },
        { [`subtasks.${index}.completed`]: completed }
      );
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json({ ok: true, task });
    } catch (err) {
      console.error('Error toggling subtask:', err);
      res.status(500).json({ error: 'Failed to toggle subtask' });
    }
  });

  // ─── Tasks: Delete ─────────────────────────────────────────────────────────

  router.delete('/tasks/:id', async (req, res) => {
    try {
      const deleted = await db.deleteOne(COLLECTION, { _id: req.params.id, ownerId: req.user._id });
      if (!deleted) return res.status(404).json({ error: 'Task not found' });
      res.json({ ok: true, deletedId: req.params.id });
    } catch (err) {
      console.error('Error deleting task:', err);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // ─── User Settings: Theme ──────────────────────────────────────────────────

  /**
   * Updates the UI theme for the currently logged-in user.
   * Expects { "theme": "dark" | "light" | "system" }
   */
// ─── User Settings: Theme ──────────────────────────────────────────────────

  router.put('/settings/theme', async (req, res) => {
    const { theme } = req.body;

    // ADDED all the new themes to the allowed list
    const allowedThemes = ['light', 'dark', 'system', 'ocean', 'midnight', 'forest', 'sunset', 'cyberpunk', 'coffee'];

    if (!allowedThemes.includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme choice' });
    }

    try {
      const user = await db.updateUserTheme(req.user._id, theme);
      
      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json({ 
        success: true, 
        theme: user.preferences?.theme || theme 
      });
    } catch (err) {
      console.error('Error updating user theme:', err);
      res.status(500).json({ error: 'Failed to save theme preference' });
    }
  });

  return router;
}

export default { createApiRouter };