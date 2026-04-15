import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

export default function DashboardLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname]);

  return (
    <div className="flex h-dvh bg-[#F8F9FA] font-sans overflow-hidden">
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar sidebar"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      <Sidebar isMobileOpen={isMobileSidebarOpen} onCloseMobile={closeMobileSidebar} />

      <main className="flex-1 flex min-w-0 flex-col h-dvh overflow-hidden">
        <TopBar onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto bg-[#F8F9FA] px-3 py-4 sm:px-5 sm:py-5 lg:px-8 lg:py-8 xl:px-10 xl:py-9 custom-scrollbar">
          <div className="w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}