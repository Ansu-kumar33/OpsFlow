import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { getStoredUser } from './services/api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Challans from './pages/Challans';
import AccessDenied from './pages/AccessDenied';

const getToken = () => localStorage.getItem('opsflow_token');

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RoleProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: Array<'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS'>;
}) => {
  const token = getToken();
  const user = getStoredUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const token = getToken();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <RoleProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
            <Customers />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <RoleProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}>
            <Products />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <RoleProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE']}>
            <Inventory />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/challans"
        element={
          <RoleProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}>
            <Challans />
          </RoleProtectedRoute>
        }
      />
      <Route path="/access-denied" element={<AccessDenied />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
