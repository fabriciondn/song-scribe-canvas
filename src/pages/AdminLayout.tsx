import { useEffect } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminService } from '@/services/adminService';
import { Skeleton } from '@/components/ui/skeleton';

const AdminLayout = () => {
  const { isAdmin, isLoading } = useAdminAuth();

  useEffect(() => {
    adminService.updateUserSession();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link to="/admin" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-lg">Painel Admin</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link to="/admin" className="transition-colors hover:text-foreground/80">Dashboard</Link>
              <Link to="/admin/users" className="transition-colors hover:text-foreground/80">Usuários</Link>
              <Link to="/admin/online" className="transition-colors hover:text-foreground/80">Online</Link>
              <Link to="/admin/certificates" className="transition-colors hover:text-foreground/80">Certificados</Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;