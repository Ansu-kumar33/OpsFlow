import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from '../controllers/productController';

const router = express.Router();

router.use(authenticateToken);
router.get('/', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), listProducts);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProductById);
router.post('/', authorizeRoles('ADMIN'), createProduct);
router.put('/:id', authorizeRoles('ADMIN'), updateProduct);
router.delete('/:id', authorizeRoles('ADMIN'), deleteProduct);

export default router;
