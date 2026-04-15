import { Router } from 'express';
import Log from '../models/Log.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(authRequired, adminOnly);

router.get('/', async (_req, res) => {
  try {
    const rows = await Log.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'name')
      .lean();

    const logs = rows.map((l) => ({
      id: l._id.toString(),
      userName: l.userId?.name || 'Unknown',
      action: l.action,
      targetId: l.targetId,
      details: l.details,
      createdAt: l.createdAt,
    }));

    res.json({ logs });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
