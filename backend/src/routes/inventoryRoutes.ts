import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import { listInventory, upsertInventory } from '../controllers/inventoryController';

const router = express.Router();

router.use(authenticateToken);
router.get('/', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), listInventory);
router.post('/', authorizeRoles('ADMIN', 'WAREHOUSE'), upsertInventory);

export default router;
