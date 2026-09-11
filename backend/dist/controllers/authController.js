"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            message: 'Email and password are required',
            status: 'error',
        });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({
            message: 'Valid email is required',
            status: 'error',
        });
    }
    try {
        const result = await database_1.pool.query('SELECT id, name, email, password, role FROM users WHERE email = $1', [normalizedEmail]);
        const user = result.rows[0];
        if (!user) {
            return res.status(401).json({
                message: 'Invalid credentials',
                status: 'error',
            });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(String(password), user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid credentials',
                status: 'error',
            });
        }
        const jwtSecret = process.env.JWT_SECRET || 'opsflow_super_secret_key_2026';
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            role: user.role,
        }, jwtSecret, { expiresIn: '1d' });
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            message: 'Login failed',
            status: 'error',
        });
    }
};
exports.login = login;
