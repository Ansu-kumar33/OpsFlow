"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const productController_1 = require("../controllers/productController");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
router.get('/', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), productController_1.listProducts);
router.get('/:id', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), productController_1.getProductById);
router.post('/', (0, authMiddleware_1.authorizeRoles)('ADMIN'), productController_1.createProduct);
router.put('/:id', (0, authMiddleware_1.authorizeRoles)('ADMIN'), productController_1.updateProduct);
router.delete('/:id', (0, authMiddleware_1.authorizeRoles)('ADMIN'), productController_1.deleteProduct);
exports.default = router;
