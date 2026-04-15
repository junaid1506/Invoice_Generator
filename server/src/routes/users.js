import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js';
import Log from '../models/Log.js';
import { authRequired, adminOnly } from '../middleware/auth.js';
import { formatExactAmount } from '../utils/invoiceHelpers.js';

const router = Router();
router.use(authRequired, adminOnly);

router.get('/', async (_req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'invoices',
          localField: '_id',
          foreignField: 'userId',
          as: 'invoices',
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          invoiceCount: { $size: '$invoices' },
          totalRevenue: {
            $sum: {
              $map: {
                input: '$invoices',
                as: 'i',
                in: {
                  $cond: [{ $eq: ['$$i.status', 'paid'] }, '$$i.total', 0],
                },
              },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const out = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      invoiceCount: u.invoiceCount,
      totalRevenue: u.totalRevenue,
      totalRevenueFormatted: formatExactAmount(u.totalRevenue),
    }));

    res.json({ users: out });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const uid = new mongoose.Types.ObjectId(req.params.id);
    const invoices = await Invoice.find({ userId: uid }).sort({ createdAt: -1 }).lean();
    const logs = await Log.find({ userId: uid }).sort({ createdAt: -1 }).limit(200).lean();

    const statusCounts = {
      draft: 0,
      submitted: 0,
      pending: 0,
      paid: 0,
      overdue: 0,
      rejected: 0,
    };
    let paidTotal = 0;
    for (const inv of invoices) {
      if (statusCounts[inv.status] !== undefined) statusCounts[inv.status] += 1;
      if (inv.status === 'paid') paidTotal += inv.total;
    }

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      invoices: invoices.map((i) => ({
        id: i._id.toString(),
        number: i.number,
        clientName: i.clientName,
        total: i.total,
        status: i.status,
        createdAt: i.createdAt,
        dueDate: i.dueDate,
      })),
      logs: logs.map((l) => ({
        id: l._id.toString(),
        action: l.action,
        targetId: l.targetId,
        details: l.details,
        createdAt: l.createdAt,
      })),
      stats: { statusCounts, paidTotal },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
