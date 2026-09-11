import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import { pool } from '../config/database';

type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

type UserRecord = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  created_at: Date | string;
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  const { email, password } = req.body as { email?: string; password?: string };

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
    const result = await pool.query<UserRecord>(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [normalizedEmail]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
        status: 'error',
      });
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials',
        status: 'error',
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'opsflow_super_secret_key_2026';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: '1d' }
    );

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
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: 'Login failed',
      status: 'error',
    });
  }
};
