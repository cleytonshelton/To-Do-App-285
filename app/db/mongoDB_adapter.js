/**
 * Mongoose Adapter for ORDB
 *
 * Implements the ORDB interface for MongoDB via Mongoose ODM.
 */

import mongoose from 'mongoose';
import { ORDB } from './ordb.js';
import User from './models/User.js';
import Task from './models/Task.js';

const MODELS = {
  tasks: Task,
  users: User
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

function wrapUpdate(update) {
  return Object.keys(update)[0].startsWith('$') ? update : { $set: update };
}


export class MongooseAdapter extends ORDB {
  constructor(uri, databaseName) {
    super();
    this.uri = uri;
    this.databaseName = databaseName;
  }

  async connect() {
    try {
      await mongoose.connect(this.uri, { dbName: this.databaseName });
      console.log(`Mongoose connected to "${this.databaseName}"`);
    } catch (err) {
      console.error('Mongoose connection error:', err);
      throw err;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('Mongoose disconnected');
  }

  async findAll(collection, filter = {}, options = {}) {
    let query = getModel(collection).find(filter);
    if (options.sort) query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    return query.lean();
  }

  async findOne(collection, filter) {
    return getModel(collection).findOne(filter).lean();
  }

  async insertOne(collection, data) {
    const doc = await getModel(collection).create(data);
    return doc.toObject();
  }

  async updateOne(collection, filter, update) {
    return getModel(collection).findOneAndUpdate(
      filter,
      wrapUpdate(update),
      { new: true, lean: true, runValidators: true }
    );
  }

  async updateUserTheme(userId, theme) {
    return this.updateOne(
      'users', 
      { _id: userId }, 
      { 'preferences.theme': theme }
    );
  }

  async deleteOne(collection, filter) {
    const { deletedCount } = await getModel(collection).deleteOne(filter);
    return deletedCount > 0;
  }

  getType() {
    return 'Mongoose';
  }
}

export default MongooseAdapter;