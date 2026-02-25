/**
 * Unified API Routes using ORDB
 * 
 * This router works with any database through the ORDB interface.
 * No database-specific code here - just business logic!
 */

import express from 'express';

export function createApiRouter(db) {
  const router = express.Router();
  const COLLECTION = 'posts';

  /**
   * GET /api/posts
   * Retrieve all posts, sorted by _id ascending
   */
  router.get('/posts', async (req, res) => {
    try {
      const posts = await db.findAll(COLLECTION, {}, { sort: { _id: 1 } });
      res.json(posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  /**
   * GET /api/posts/:id
   * Retrieve a single post by ID
   */
  router.get('/posts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid id' });
      }

      const post = await db.findOne(COLLECTION, { _id: id });
      
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      res.json(post);
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  });

  /**
   * POST /api/posts
   * Create a new post with auto-increment _id and default status
  */
  router.post('/posts', async (req, res) => {
    try {
      const { title, date, status } = req.body || {};
      
      if (!title) {
        return res.status(400).json({ error: 'title is required' });
      }

      // Automatically defaults to 'pending' if status is missing
      const newPost = await db.insertOne(COLLECTION, {
        title,
        date: date || '',
        status: status || 'pending'
      });
      
      res.status(201).json(newPost);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  /**
   * PUT /api/posts/:id
   * Update an existing post including its status
   */
  router.put('/posts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid id' });
      }

      const { title, date, status } = req.body || {};
      
      const update = {};
      if (title !== undefined) update.title = title;
      if (date !== undefined) update.date = date;
      if (status !== undefined) update.status = status; // Added status support

      if (Object.keys(update).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const updatedPost = await db.updateOne(
        COLLECTION,
        { _id: id },
        update
      );
      
      if (!updatedPost) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      res.json(updatedPost);
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  });

  /**
   * DELETE /api/posts/:id
   * Delete a post by ID
   */
  router.delete('/posts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid id' });
      }

      const deleted = await db.deleteOne(COLLECTION, { _id: id });
      
      if (!deleted) {
        return res.status(404).json({ error: 'Post not found' });
      }
      
      res.json({ ok: true, deletedId: id });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  });

  return router;
}

export default { createApiRouter };