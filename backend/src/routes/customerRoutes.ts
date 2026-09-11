import express from 'express';
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
} from '../controllers/customerController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);
router.get('/', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), listCustomers);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), getCustomerById);
router.post('/', authorizeRoles('ADMIN', 'SALES'), createCustomer);
router.put('/:id', authorizeRoles('ADMIN', 'SALES'), updateCustomer);
router.delete('/:id', authorizeRoles('ADMIN'), deleteCustomer);

export default router;
