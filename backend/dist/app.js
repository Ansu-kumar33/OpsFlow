"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const customerRoutes_1 = __importDefault(require("./routes/customerRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const inventoryRoutes_1 = __importDefault(require("./routes/inventoryRoutes"));
const stockMovementRoutes_1 = __importDefault(require("./routes/stockMovementRoutes"));
const challanRoutes_1 = __importDefault(require("./routes/challanRoutes"));
const database_1 = require("./config/database");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 5000;
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS blocked origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.get('/', (_req, res) => {
    res.status(200).json({
        message: 'OpsFlow API is running',
        status: 'success',
    });
});
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        message: 'OpsFlow backend is healthy',
        status: 'success',
    });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/customers', customerRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/inventory', inventoryRoutes_1.default);
app.use('/api/stock-movements', stockMovementRoutes_1.default);
app.use('/api/challans', challanRoutes_1.default);
const startServer = async () => {
    const connected = await (0, database_1.testDatabaseConnection)();
    if (!connected) {
        console.warn('Server started without a successful PostgreSQL connection check.');
    }
    app.listen(port, () => {
        console.log(`OpsFlow API running on port ${port}`);
    });
};
startServer();
exports.default = app;
