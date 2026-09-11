# OpsFlow — Mini ERP + CRM Operations Portal

## Project Overview

OpsFlow is a full-stack Mini ERP + CRM Operations Portal designed for a wholesale/distribution business.

The system manages customers, products, inventory, stock movements, and sales challans with role-based access control.

## Features

- JWT-based authentication
- Role-based access control
- Customer CRM
- Product management
- Inventory management
- Stock IN/OUT movements
- Stock movement history
- Sales challan management
- Draft, Confirmed and Cancelled challan status
- Stock validation
- Prevention of negative stock
- Product snapshot in challan items
- Responsive admin-style interface

## User Roles

### Admin
Full access to the system.

### Sales
Can manage customers, view products/inventory and create/view sales challans.

### Warehouse
Can manage inventory and stock movements and view required operational information.

### Accounts
Can view customers, products and sales challans.

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- HTML
- CSS

### Backend
- Node.js
- Express.js
- TypeScript
- REST APIs
- JWT
- bcrypt

### Database
- PostgreSQL

## Project Structure

```text
OpsFlow/
├── frontend/
│   ├── src/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── .env
│   └── package.json
│
└── README.md
