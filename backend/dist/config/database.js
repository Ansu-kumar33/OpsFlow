"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabaseConnection = exports.pool = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'opsflow',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});
exports.pool = pool;
const testDatabaseConnection = async () => {
    try {
        await pool.query('SELECT 1');
        console.log('PostgreSQL connected successfully');
        return true;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown database error';
        console.error('PostgreSQL connection failed:', message);
        return false;
    }
};
exports.testDatabaseConnection = testDatabaseConnection;
