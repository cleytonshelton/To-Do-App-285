import express from 'express';
import { requireAuth, checkUser } from '../db/middleware/authMiddleware.js';
import authController from '../db/controllers/authController.js';

const COLLECTION = 'tasks';

function parseSubtasks(subtasks, withCompleted = false) {
    if (!subtasks) return [];
    return Object.values(subtasks).map(sub =>
        withCompleted
            ? { title: sub.title, completed: sub.completed === 'true' || sub.completed === true }
            : sub
    );
}

export function createRouter(db) {
    const router = express.Router();

    // 1. Set user context for all routes (navbar user status)
    router.use(checkUser);

    // ─── Public Routes ────────────────────────────────────────────────────────
    
    router.get('/', (_req, res) => res.render('home.ejs'));

    // Login Routes
    router.get('/login', (req, res) => res.render('login.ejs'));
    router.post('/login', authController.login_post);

    // Signup Routes
    router.get('/signup', (req, res) => res.render('signup.ejs'));
    router.post('/signup', authController.signup_post);

    // Logout
    router.get('/logout', authController.logout_get);

    // ─── Protected Routes (Redirects to /login if not authed) ───────────────────
    
    // Everything below this line is "locked"
    router.use(requireAuth);

    router.get('/write', (_req, res) => res.render('write.ejs'));
    router.get('/calendar', (_req, res) => res.render('calendar.ejs'));
    router.get('/dashboard', (_req, res) => res.render('dashboard.ejs'));

    router.get('/list', async (req, res) => {
        try {
            const tasks = await db.findAll(COLLECTION, { ownerId: req.user._id }, { sort: { createdAt: 1 } });
            res.render('list.ejs', { posts: tasks });
        } catch (err) {
            console.error('Error fetching tasks:', err);
            res.status(500).send('Failed to fetch tasks');
        }
    });

    router.get('/listjson', async (req, res) => {
        try {
            const tasks = await db.findAll(COLLECTION, { ownerId: req.user._id });
            res.json(tasks);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch tasks' });
        }
    });

    router.get('/detail/:id', async (req, res) => {
        try {
            const data = await db.findOne(COLLECTION, { _id: req.params.id, ownerId: req.user._id });
            if (!data) return res.status(404).send('Task not found');
            res.render('detail.ejs', { data });
        } catch (err) {
            res.status(500).send('Error fetching task detail');
        }
    });

    router.post('/add', async (req, res) => {
        try {
            const { title, date, status, priority, subtasks } = req.body;
            await db.insertOne(COLLECTION, {
                title: title || '',
                date: date || null,
                status: status || 'Pending',
                priority: parseInt(priority) || 3,
                subtasks: parseSubtasks(subtasks),
                ownerId: req.user._id, 
            });
            res.redirect('/list');
        } catch (err) {
            res.status(500).send('Failed to add task');
        }
    });

    router.get('/edit/:id', async (req, res) => {
        try {
            const data = await db.findOne(COLLECTION, { _id: req.params.id, ownerId: req.user._id });
            if (!data) return res.status(404).send('Task not found');
            res.render('edit.ejs', { data });
        } catch (err) {
            res.status(500).send('Error fetching task for editing');
        }
    });

    router.put('/edit', async (req, res) => {
        try {
            const { id, title, date, status, priority, subtasks } = req.body;
            const updateData = {
                ...(title !== undefined && { title }),
                ...(date !== undefined && { date }),
                ...(status !== undefined && { status }),
                ...(priority !== undefined && { priority: parseInt(priority) }),
                ...(subtasks !== undefined && { subtasks: parseSubtasks(subtasks, true) }),
            };

            const updated = await db.updateOne(COLLECTION, { _id: id, ownerId: req.user._id }, updateData);
            if (!updated) return res.status(403).send('Unauthorized');

            const isAjax = req.xhr || req.headers.accept?.includes('json');
            return isAjax ? res.json({ ok: true }) : res.redirect('/list');
        } catch (err) {
            res.status(500).send('Failed to update task');
        }
    });

    router.put('/tasks/:id/subtask/:index', async (req, res) => {
        try {
            const { id, index } = req.params;
            const completed = req.body.completed === 'true' || req.body.completed === true;

            const updatedTask = await db.updateOne(
                COLLECTION,
                { _id: id, ownerId: req.user._id },
                { [`subtasks.${index}.completed`]: completed }
            );

            if (!updatedTask) return res.status(404).json({ error: 'Unauthorized' });
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: 'Failed to toggle subtask' });
        }
    });

    router.delete('/delete', async (req, res) => {
        try {
            const { _id } = req.body;
            const deleted = await db.deleteOne(COLLECTION, { _id, ownerId: req.user._id });
            if (!deleted) return res.status(404).json({ error: 'Unauthorized' });
            res.json({ ok: true });
        } catch (err) {
            res.status(500).json({ error: 'Failed to delete task' });
        }
    });

    return router;
}

export default { createRouter };