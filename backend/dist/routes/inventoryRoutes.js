"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const inventoryController_1 = require("../controllers/inventoryController");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
router.get('/', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), inventoryController_1.listInventory);
router.post('/', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'WAREHOUSE'), inventoryController_1.upsertInventory);
exports.default = router;
