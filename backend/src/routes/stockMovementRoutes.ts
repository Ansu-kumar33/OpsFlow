import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import { createStockMovement, listStockMovements } from '../controllers/stockMovementController';

const router = express.Router();

router.use(authenticateToken);
router.get('/', authorizeRoles('ADMIN', 'WAREHOUSE'), listStockMovements);
router.post('/', authorizeRoles('ADMIN', 'WAREHOUSE'), createStockMovement);

export default router;
