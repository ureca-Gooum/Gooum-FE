import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export const MainLayout = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-canvas ">
      <Header />
      <div className="flex flex-1 overflow-hidden pt-1 pb-2.5 pr-2.5 gap-4">
        <Sidebar />
        <Outlet />
      </div>
    </div>
  );
};
