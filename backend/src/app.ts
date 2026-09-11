import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import productRoutes from './routes/productRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import stockMovementRoutes from './routes/stockMovementRoutes';
import challanRoutes from './routes/challanRoutes';
import { testDatabaseConnection } from './config/database';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const corsOptions: cors.CorsOptions = {
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

app.use(cors(corsOptions));
app.use(express.json());

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

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/challans', challanRoutes);

const startServer = async (): Promise<void> => {
  const connected = await testDatabaseConnection();

  if (!connected) {
    console.warn('Server started without a successful PostgreSQL connection check.');
  }

  app.listen(port, () => {
    console.log(`OpsFlow API running on port ${port}`);
  });
};

startServer();

export default app;
