/**
 * Mongoose Adapter for ORDB
 * 
 * Implements the ORDB interface for MongoDB database operations.
 * Uses Mongoose ODM with defined schemas.
 */

import mongoose from 'mongoose';
import { ORDB } from './ordb.js';
import Task from './models/Task.js';

const MODELS = {
  tasks: Task,
};

function getModel(collection) {
  const model = MODELS[collection];
  if (!model) {
    throw new Error(
      `No Mongoose model registered for collection "${collection}". ` +
      `Add it to the MODELS registry in mongoose-adapter.js.`
    );
  }
  return model;
}

// ── Adapter ────────────────────────────────────────────────────────────────────
export class MongooseAdapter extends ORDB {
  constructor(uri, databaseName) {
    super();
    this.uri = uri;
    this.databaseName = databaseName;
  }

  /**
   * Connect to MongoDB via Mongoose
   */
  async connect() {
    try {
      console.log('URI');
      console.log(this.uri);

      await mongoose.connect(this.uri, {
        dbName: this.databaseName,
      });

      console.log('Mongoose connected successfully');
    } catch (error) {
      console.error('Mongoose connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    await mongoose.disconnect();
    console.log('Mongoose disconnected');
  }

  /**
   * Find all documents in a collection
   */
  async findAll(collection, filter = {}, options = {}) {
    const Model = getModel(collection);
    let query = Model.find(filter);

    if (options.sort) {
      query = query.sort(options.sort);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    return await query.lean();
  }

  /**
   * Find one document by filter
   */
  async findOne(collection, filter) {
    const Model = getModel(collection);
    return await Model.findOne(filter).lean();
  }

  /**
   * Insert a new document
   */
  async insertOne(collection, data) {
    const Model = getModel(collection);
    const doc = await Model.create(data);
    return doc.toObject();
  }

  /**
   * Update one document
   * Returns the updated document
   */
  async updateOne(collection, filter, update) {
    const Model = getModel(collection);
    // If the update object doesn't start with $, wrap it in $set for safety
    const finalUpdate = Object.keys(update)[0].startsWith('$') ? update : { $set: update };
    
    return await Model.findOneAndUpdate(
      filter,
      finalUpdate,
      { new: true, lean: true, runValidators: true }
    );
  }

  /**
   * Delete one document
   * Returns true if deleted, false if not found
   */
  async deleteOne(collection, filter) {
    const Model = getModel(collection);
    const result = await Model.deleteOne(filter);
    return result.deletedCount > 0;
  }

  /**
   * Get the database type name
   */
  getType() {
    return 'Mongoose';
  }
}

export default MongooseAdapter;