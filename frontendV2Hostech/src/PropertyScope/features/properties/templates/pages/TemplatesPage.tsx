import { Outlet } from 'react-router-dom';

export function TemplatesPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <Outlet />
    </div>
  );
}

