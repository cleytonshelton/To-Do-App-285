/**
 * View Routes - Express Router for EJS Templates
 * 
 * This router handles all view-related routes that render EJS templates.
 * It works with any database through the ORDB abstraction layer.
 */

import express from 'express';

/**
 * Create and configure the view router
 * @param {Object} db - Database instance (ORDB bridge)
 * @returns {express.Router} Configured Express router
 */
export function createRouter(db) {
  const router = express.Router();
  const COLLECTION = 'tasks'; // ← updated from 'posts'

  /**
   * GET / - Home page
   */
  router.get('/', (req, res) => {
    res.render('home.ejs');
  });

  /**
   * GET /write - Write form page
   */
  router.get('/write', (req, res) => {
    res.render('write.ejs');
  });

  /**
   * POST /add - Create a new task from form submission
   */
  router.post('/add', async (req, res) => {
    try {
      const { title, date, status, priority, subtasks } = req.body;
      const subtaskList = subtasks ? Object.values(subtasks) : [];

      await db.insertOne(COLLECTION, {
        title: title || '',
        date: date || null,
        status: status || 'Pending',
        priority: parseInt(priority) || 3,
        subtasks: subtaskList
      });

      res.redirect('/list');
    } catch (error) {
      console.error('Error adding task:', error);
      res.status(500).send('Failed to add task');
    }
  });

  /**
   * GET /list - Display all tasks
   */
  router.get('/list', async (req, res) => {
    try {
      const tasks = await db.findAll(COLLECTION, {}, { sort: { createdAt: 1 } });
      res.render('list.ejs', { posts: tasks }); // keep 'posts' key if EJS templates use it
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).send('Failed to fetch tasks');
    }
  });

  /**
   * GET /detail/:id - Display single task detail
   */
  router.get('/detail/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = await db.findOne(COLLECTION, { _id: id });

      if (data) {
        res.render('detail.ejs', { data });
      } else {
        res.status(404).send('Task not found');
      }
    } catch (error) {
      console.error('Error fetching detail:', error);
      res.status(500).send('Error fetching task detail');
    }
  });

  /**
   * GET /edit/:id - Display edit form for a task
   */
  router.get('/edit/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const data = await db.findOne(COLLECTION, { _id: id });

      if (data) {
        res.render('edit.ejs', { data });
      } else {
        res.status(404).send('Task not found');
      }
    } catch (error) {
      console.error('Error fetching edit form:', error);
      res.status(500).send('Error fetching task for editing');
    }
  });

  /**
   * PUT /edit - Update a task from form submission
   */
  router.put('/edit', async (req, res) => {
    try {
      const { id, title, date, status, priority, subtasks } = req.body;

      // Create an update object containing ONLY the fields that were sent
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (date !== undefined) updateData.date = date;
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = parseInt(priority);

      // Handle Subtasks if they exist in the request
      if (subtasks !== undefined) {
        updateData.subtasks = Object.values(subtasks).map(sub => ({
          title: sub.title,
          completed: sub.completed === 'true' || sub.completed === true
        }));
      }

      await db.updateOne(
        COLLECTION,
        { _id: id },
        updateData // This only updates what is present in updateData
      );

      // If it's an AJAX request (like your drag-and-drop), return JSON
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.json({ ok: true });
      }

      // Otherwise, redirect (for the standard Edit Form)
      res.redirect('/list');
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).send('Failed to update task');
    }
  });

  /**
   * PUT /tasks/:id/subtask/:index - Toggle subtask status (AJAX)
   */
  router.put('/tasks/:id/subtask/:index', async (req, res) => {
    try {
      const { id, index } = req.params;
      const { completed } = req.body;

      // Construct the positional update path for Mongoose/MongoDB
      const updatePath = `subtasks.${index}.completed`;

      // Use the ORDB bridge to update the specific sub-document field
      const updatedTask = await db.updateOne(
        COLLECTION,
        { _id: id },
        { [updatePath]: completed === 'true' || completed === true }
      );

      if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ ok: true, updatedTask });
    } catch (error) {
      console.error('Error toggling subtask:', error);
      res.status(500).json({ error: 'Failed to toggle subtask' });
    }
  });


  /**
   * DELETE /delete - Delete a task (AJAX request)
   */
  router.delete('/delete', async (req, res) => {
    try {
      const { _id } = req.body;

      const deleted = await db.deleteOne(COLLECTION, { _id });

      if (!deleted) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ ok: true, deletedId: _id });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  router.get('/listjson', async (req, res) => {
    const tasks = await db.findAll('tasks');
    res.json(tasks);
  });

  router.get('/calendar', function (req, resp) {
    resp.render('calendar.ejs');
  });

  router.get('/dashboard', async (req, res) => {
    res.render('dashboard.ejs');
  });

  return router;
}

export default { createRouter };