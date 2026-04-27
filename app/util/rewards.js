import User from '../db/models/User.js';

const BASE_TASK_POINTS = 10;
const PRIORITY_BONUS = {
  1: 6,
  2: 4,
  3: 2,
  4: 0,
};

export function calculateTaskPoints(task = {}) {
  const priority = Number(task.priority ?? 3);
  return BASE_TASK_POINTS + (PRIORITY_BONUS[priority] ?? PRIORITY_BONUS[3]);
}

export async function adjustUserPoints(userId, delta) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.points = Math.max(0, (user.points ?? 0) + delta);
  await user.save();
  return user;
}

export async function createTaskWithRewards(db, ownerId, taskData) {
  const task = {
    ...taskData,
    ownerId,
    pointsEarned: 0,
  };

  if (task.status === 'Completed') {
    const earned = calculateTaskPoints(task);
    task.pointsEarned = earned;
    await adjustUserPoints(ownerId, earned);
  }

  return db.insertOne('tasks', task);
}

export async function updateTaskWithRewards(db, taskId, ownerId, updateFields) {
  const task = await db.findOne('tasks', { _id: taskId, ownerId });
  if (!task) return null;

  const currentStatus = task.status;
  const newStatus = updateFields.status ?? currentStatus;
  const updatePayload = { ...updateFields };

  if (newStatus !== currentStatus) {
    const wasCompleted = currentStatus === 'Completed';
    const willBeCompleted = newStatus === 'Completed';
    const pointsForTask = calculateTaskPoints(task);

    if (willBeCompleted && !wasCompleted) {
      const earned = task.pointsEarned || pointsForTask;
      updatePayload.pointsEarned = earned;
      await adjustUserPoints(ownerId, earned);
    }

    if (!willBeCompleted && wasCompleted) {
      const removed = task.pointsEarned || pointsForTask;
      updatePayload.pointsEarned = 0;
      await adjustUserPoints(ownerId, -removed);
    }
  }

  return db.updateOne('tasks', { _id: taskId, ownerId }, updatePayload);
}

export async function redeemReward(userId, rewardName, cost) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if ((user.points ?? 0) < cost) throw new Error('Not enough points');

  user.points -= cost;
  user.rewardsHistory.push({ item: rewardName, cost, redeemedAt: new Date() });
  await user.save();
  return user;
}
