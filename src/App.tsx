import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CompanyProvider, useCompany } from "@/contexts/CompanyContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SelectCompany from "./pages/SelectCompany";
import RegisterCompany from "./pages/RegisterCompany";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import EmployeeProfile from "./pages/EmployeeProfile";
import Attendance from "./pages/Attendance";
import Leaves from "./pages/Leaves";
import Payroll from "./pages/Payroll";
import Billing from "./pages/Billing";
import OrgChart from "./pages/OrgChart";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Super Admin pages
import SuperAdminLogin from "./pages/super-admin/SuperAdminLogin";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import SuperAdminAnalytics from "./pages/super-admin/SuperAdminAnalytics";
import SuperAdminSystemMonitor from "./pages/super-admin/SuperAdminSystemMonitor";
import SuperAdminAuditLogs from "./pages/super-admin/SuperAdminAuditLogs";
import SuperAdminCompanies from "./pages/super-admin/SuperAdminCompanies";
import SuperAdminUsers from "./pages/super-admin/SuperAdminUsers";
import SuperAdminSubscriptions from "./pages/super-admin/SuperAdminSubscriptions";
import SuperAdminPlans from "./pages/super-admin/SuperAdminPlans";
import SuperAdminSettings from "./pages/super-admin/SuperAdminSettings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { company, loading: companyLoading } = useCompany();
  
  // Initialize session timeout for authenticated users
  if (user && !loading) {
    useSessionTimeout();
  }

  if (loading || companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/select-company" replace />;
  }

  if (!company) {
    return <Navigate to="/select-company" replace />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/select-company" element={<SelectCompany />} />
      <Route path="/register-company" element={<RegisterCompany />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
      <Route path="/employees/:id" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/leaves" element={<ProtectedRoute><Leaves /></ProtectedRoute>} />
      <Route path="/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
      <Route path="/org-chart" element={<ProtectedRoute><OrgChart /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      
      {/* Super Admin routes */}
      <Route path="/super-admin/login" element={<SuperAdminLogin />} />
      <Route path="/super-admin" element={<SuperAdminDashboard />} />
      <Route path="/super-admin/analytics" element={<SuperAdminAnalytics />} />
      <Route path="/super-admin/system-monitor" element={<SuperAdminSystemMonitor />} />
      <Route path="/super-admin/audit-logs" element={<SuperAdminAuditLogs />} />
      <Route path="/super-admin/companies" element={<SuperAdminCompanies />} />
      <Route path="/super-admin/users" element={<SuperAdminUsers />} />
      <Route path="/super-admin/subscriptions" element={<SuperAdminSubscriptions />} />
      <Route path="/super-admin/plans" element={<SuperAdminPlans />} />
      <Route path="/super-admin/settings" element={<SuperAdminSettings />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CompanyProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </CompanyProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
