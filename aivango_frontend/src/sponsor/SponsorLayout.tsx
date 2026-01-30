import { Outlet } from 'react-router-dom';

export default function SponsorLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Outlet />
    </div>
  );
}
