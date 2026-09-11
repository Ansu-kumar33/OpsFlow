"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const customerController_1 = require("../controllers/customerController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
router.get('/', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'SALES', 'ACCOUNTS'), customerController_1.listCustomers);
router.get('/:id', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'SALES', 'ACCOUNTS'), customerController_1.getCustomerById);
router.post('/', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'SALES'), customerController_1.createCustomer);
router.put('/:id', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'SALES'), customerController_1.updateCustomer);
router.delete('/:id', (0, authMiddleware_1.authorizeRoles)('ADMIN'), customerController_1.deleteCustomer);
exports.default = router;
