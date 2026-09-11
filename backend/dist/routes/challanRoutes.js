"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const challanController_1 = require("../controllers/challanController");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
router.get('/', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), challanController_1.listChallans);
router.get('/:id', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), challanController_1.getChallanById);
router.post('/', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'SALES'), challanController_1.createChallan);
router.post('/:id/confirm', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'SALES'), challanController_1.confirmChallan);
router.post('/:id/cancel', (0, authMiddleware_1.authorizeRoles)('ADMIN', 'SALES'), challanController_1.cancelChallan);
exports.default = router;
