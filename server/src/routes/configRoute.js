import { Router } from 'express';
import { APP_NAME, COMPANY_HOME_STATE, FIXED_HSN_SAC, INDIAN_STATES, PREDEFINED_TERMS } from '../config.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    appName: APP_NAME,
    companyHomeState: COMPANY_HOME_STATE,
    fixedHsnSac: FIXED_HSN_SAC,
    indianStates: INDIAN_STATES,
    predefinedTermKeys: Object.keys(PREDEFINED_TERMS),
  });
});

export default router;
