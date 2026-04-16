import { Router } from 'express';
import Company from '../models/Company.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);

router.get('/me', async (req, res) => {
  const company = await Company.findOne({ userId: req.userId }).lean();
  res.json({ company: company || null });
});

router.put('/me', async (req, res) => {
  const body = req.body || {};
  const userId = req.userId;

  // Basic required fields for “company details filled” UX
  const companyName = String(body.companyName || '').trim();
  const companyAddress = String(body.companyAddress || '').trim();
  const companyPhone = String(body.companyPhone || '').trim();
  const companyEmail = String(body.companyEmail || '').trim();
  const companyWebsite = String(body.companyWebsite || '').trim();
  const companyLogo = String(body.companyLogo || '').trim();
  const companyGstin = String(body.companyGstin || '').trim().toUpperCase();
  const companyHomeState = String(body.companyHomeState || '').trim();

  if (!companyName || !companyAddress || !companyHomeState) {
    return res.status(400).json({
      message: 'companyName, companyAddress, and companyHomeState are required',
    });
  }

  const update = {
    companyName,
    companyAddress,
    companyPhone,
    companyEmail,
    companyWebsite,
    companyLogo,
    companyGstin,
    companyHomeState,

    gstBankName: String(body.gstBankName || '').trim(),
    gstAccountName: String(body.gstAccountName || '').trim(),
    gstAccountNo: String(body.gstAccountNo || '').trim(),
    gstIfsc: String(body.gstIfsc || '').trim(),
    gstBranch: String(body.gstBranch || '').trim(),

    nongstBankName: String(body.nongstBankName || '').trim(),
    nongstAccountName: String(body.nongstAccountName || '').trim(),
    nongstAccountNo: String(body.nongstAccountNo || '').trim(),
    nongstIfsc: String(body.nongstIfsc || '').trim(),
    nongstUpi: String(body.nongstUpi || '').trim(),
  };

  await Company.findOneAndUpdate({ userId }, update, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });

  const company = await Company.findOne({ userId }).lean();
  res.json({ company });
});

export default router;

