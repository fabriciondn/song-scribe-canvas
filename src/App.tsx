
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, LoginMessageProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import Composer from "./pages/Composer";
import Cifrador from "./pages/Cifrador";
import Bases from "./pages/Bases";
import Templates from "./pages/Templates";
import Folders from "./pages/Folders";
import Drafts from "./pages/Drafts";
import Partnerships from "./pages/Partnerships";
import AuthorRegistration from "./pages/AuthorRegistration";
import RegisteredWorks from "./pages/RegisteredWorks";
import Trash from "./pages/Trash";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminOnlineUsers from "./pages/AdminOnlineUsers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LoginMessageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="composer" element={<Composer />} />
                  <Route path="cifrador" element={<Cifrador />} />
                  <Route path="bases" element={<Bases />} />
                  <Route path="templates" element={<Templates />} />
                  <Route path="folders/*" element={<Folders />} />
                  <Route path="drafts" element={<Drafts />} />
                  <Route path="partnerships" element={<Partnerships />} />
                  <Route path="author-registration" element={<AuthorRegistration />} />
                  <Route path="registered-works" element={<RegisteredWorks />} />
                  <Route path="trash" element={<Trash />} />
                </Route>
                <Route path="/composer" element={<Dashboard />}>
                  <Route index element={<Composer />} />
                </Route>
                <Route path="/cifrador" element={<Dashboard />}>
                  <Route index element={<Cifrador />} />
                </Route>
                <Route path="/bases" element={<Dashboard />}>
                  <Route index element={<Bases />} />
                </Route>
                <Route path="/templates" element={<Dashboard />}>
                  <Route index element={<Templates />} />
                </Route>
                <Route path="/folders/*" element={<Dashboard />}>
                  <Route path="*" element={<Folders />} />
                </Route>
                <Route path="/drafts" element={<Dashboard />}>
                  <Route index element={<Drafts />} />
                </Route>
                <Route path="/partnerships" element={<Dashboard />}>
                  <Route index element={<Partnerships />} />
                </Route>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="online" element={<AdminOnlineUsers />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LoginMessageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
