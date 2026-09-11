"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("./config/database");
dotenv_1.default.config();
const users = [
    {
        name: 'Admin User',
        email: 'admin@opsflow.com',
        password: 'Admin@123',
        role: 'ADMIN',
    },
    {
        name: 'Sales User',
        email: 'sales@opsflow.com',
        password: 'Sales@123',
        role: 'SALES',
    },
    {
        name: 'Warehouse User',
        email: 'warehouse@opsflow.com',
        password: 'Warehouse@123',
        role: 'WAREHOUSE',
    },
    {
        name: 'Accounts User',
        email: 'accounts@opsflow.com',
        password: 'Accounts@123',
        role: 'ACCOUNTS',
    },
];
const seedUsers = async () => {
    await database_1.pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
    const hashedUsers = await Promise.all(users.map(async (user) => ({
        ...user,
        password: await bcryptjs_1.default.hash(user.password, 10),
    })));
    const insertQuery = `
    INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      password = EXCLUDED.password,
      role = EXCLUDED.role
  `;
    for (const user of hashedUsers) {
        await database_1.pool.query(insertQuery, [user.name, user.email, user.password, user.role]);
    }
    console.log('Users seeded successfully');
};
seedUsers()
    .then(() => {
    database_1.pool.end();
})
    .catch((error) => {
    console.error('User seeding failed:', error);
    database_1.pool.end();
    process.exit(1);
});
