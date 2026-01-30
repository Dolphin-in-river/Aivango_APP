import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSponsorDemo } from './SponsorDemoContext';
import type { UserRole } from './types';

type Props = {
  allow: UserRole | UserRole[];
  children: ReactElement;
};

export default function RequireSponsorRole({ allow, children }: Props) {
  const { userRole } = useSponsorDemo();
  const location = useLocation();

  const allowList = Array.isArray(allow) ? allow : [allow];

  if (!allowList.includes(userRole)) {
    return <Navigate to="/sponsor" replace state={{ from: location.pathname }} />;
  }

  return children;
}
