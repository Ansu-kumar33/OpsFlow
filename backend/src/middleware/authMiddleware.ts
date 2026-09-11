import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

type JwtUser = {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Access token missing or invalid',
      status: 'error',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      message: 'Access token missing or invalid',
      status: 'error',
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'opsflow_super_secret_key_2026';
    const decoded = jwt.verify(token, jwtSecret) as JwtUser;

    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({
      message: 'Invalid or expired token',
      status: 'error',
    });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        status: 'error',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied',
        status: 'error',
      });
    }

    next();
  };
};
