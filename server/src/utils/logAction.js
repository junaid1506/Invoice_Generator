import Log from '../models/Log.js';

export async function logAction(userId, action, targetId = null, details = null) {
  try {
    await Log.create({
      userId,
      action,
      targetId: targetId != null ? String(targetId) : null,
      details,
    });
  } catch (e) {
    console.error('logAction failed', e.message);
  }
}
