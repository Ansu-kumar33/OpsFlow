import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import {
  cancelChallan,
  confirmChallan,
  createChallan,
  getChallanById,
  listChallans,
} from '../controllers/challanController';

const router = express.Router();

router.use(authenticateToken);
router.get('/', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), listChallans);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getChallanById);
router.post('/', authorizeRoles('ADMIN', 'SALES'), createChallan);
router.post('/:id/confirm', authorizeRoles('ADMIN', 'SALES'), confirmChallan);
router.post('/:id/cancel', authorizeRoles('ADMIN', 'SALES'), cancelChallan);

export default router;
