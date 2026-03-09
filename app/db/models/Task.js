import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false }
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    // Priority field: 1 = Critical, 2 = High, 3 = Medium, 4 = Low
    priority: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 3, 
    },
    // Nested Subtasks
    subtasks: [subtaskSchema]
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Task = mongoose.model('Task', taskSchema);
export default Task;