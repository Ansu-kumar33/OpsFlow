"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const stockMovementController_1 = require("../controllers/stockMovementController");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
router.get('/', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'WAREHOUSE'), stockMovementController_1.listStockMovements);
router.post('/', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'WAREHOUSE'), stockMovementController_1.createStockMovement);
exports.default = router;
