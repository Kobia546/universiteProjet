import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNavDrawer } from './MobileNavDrawer';

export function AppLayout() {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <MobileNavDrawer isOpen={menuOuvert} onClose={() => setMenuOuvert(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onOpenMenu={() => setMenuOuvert(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
