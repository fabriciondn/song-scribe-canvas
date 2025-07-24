import { useQuery } from '@tanstack/react-query';
import { adminService, type AdminDashboardStats } from '@/services/adminService';

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: adminService.getDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2
  });
};

export const useOnlineUsers = () => {
  return useQuery({
    queryKey: ['online-users'],
    queryFn: adminService.getOnlineUsers,
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 2
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: adminService.getAllUsers,
    retry: 2
  });
};

export const useCertificateTemplates = () => {
  return useQuery({
    queryKey: ['certificate-templates'],
    queryFn: adminService.getCertificateTemplates,
    retry: 2
  });
};