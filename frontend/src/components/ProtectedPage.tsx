import { Navigate } from 'react-router-dom';
import { getStoredUser } from '../services/api';

export type AllowedRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

const ProtectedPage = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: AllowedRole[];
}) => {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};

export default ProtectedPage;
