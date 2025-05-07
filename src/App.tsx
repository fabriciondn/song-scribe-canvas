
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, LoginMessageProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Composer from "./pages/Composer";
import Templates from "./pages/Templates";
import Folders from "./pages/Folders";
import Drafts from "./pages/Drafts";
import Partnerships from "./pages/Partnerships";
import NotFound from "./pages/NotFound";

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
                  <Route index element={<Composer />} />
                  <Route path="composer" element={<Composer />} />
                  <Route path="templates" element={<Templates />} />
                  <Route path="folders/*" element={<Folders />} />
                  <Route path="drafts" element={<Drafts />} />
                  <Route path="partnerships" element={<Partnerships />} />
                </Route>
                <Route path="/composer" element={<Dashboard />}>
                  <Route index element={<Composer />} />
                </Route>
                <Route path="/templates" element={<Dashboard />}>
                  <Route index element={<Templates />} />
                </Route>
                <Route path="/folders/*" element={<Dashboard />}>
                  <Route index element={<Folders />} />
                  <Route path=":folderId" element={<Folders />} />
                </Route>
                <Route path="/drafts" element={<Dashboard />}>
                  <Route index element={<Drafts />} />
                </Route>
                <Route path="/partnerships" element={<Dashboard />}>
                  <Route index element={<Partnerships />} />
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
