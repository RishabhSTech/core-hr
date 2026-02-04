import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  Shield,
  Menu,
  X,
  Bell,
  ChevronRight,
  Sparkles,
  Package,
  TrendingUp,
  Activity,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/super-admin', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & metrics' },
  { href: '/super-admin/analytics', icon: TrendingUp, label: 'Analytics', description: 'Growth & insights' },
  { href: '/super-admin/system-monitor', icon: Activity, label: 'System Monitor', description: 'Real-time metrics' },
  { href: '/super-admin/audit-logs', icon: AlertCircle, label: 'Audit Logs', description: 'Activity history' },
  { href: '/super-admin/companies', icon: Building2, label: 'Companies', description: 'Manage organizations' },
  { href: '/super-admin/users', icon: Users, label: 'Users', description: 'User management' },
  { href: '/super-admin/subscriptions', icon: CreditCard, label: 'Subscriptions', description: 'Billing overview' },
  { href: '/super-admin/plans', icon: Package, label: 'Plans', description: 'Pricing & tiers' },
  { href: '/super-admin/settings', icon: Settings, label: 'Settings', description: 'System configuration' },
];

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/super-admin/login');
        return;
      }

      const { data, error } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) {
        navigate('/super-admin/login');
        return;
      }

      setIsSuperAdmin(true);
    };

    checkSuperAdmin();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/super-admin/login');
  };

  if (isSuperAdmin === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-purple-200/70">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-white">Admin Panel</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white hover:bg-white/10"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/80 backdrop-blur-xl border-r border-white/10 transform transition-transform lg:translate-x-0 lg:static",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-white/10 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-lg text-white">CoreHR</span>
                  <p className="text-xs text-purple-200/50">Administration</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all group",
                      isActive
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30"
                        : "text-purple-200/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive ? "bg-purple-500/30" : "bg-white/5 group-hover:bg-white/10"
                    )}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{item.label}</span>
                      <p className="text-xs text-purple-200/50">{item.description}</p>
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4 text-purple-400" />}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10">
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">Pro Tip</span>
                </div>
                <p className="text-xs text-purple-200/70">
                  Use keyboard shortcuts for faster navigation. Press '?' for help.
                </p>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-purple-200/70 hover:text-white hover:bg-white/5"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-h-screen">
          {/* Top bar */}
          <div className="hidden lg:flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h1 className="text-xl font-bold text-white">
                {navItems.find(item => item.href === location.pathname)?.label || 'Dashboard'}
              </h1>
              <p className="text-sm text-purple-200/50">
                {navItems.find(item => item.href === location.pathname)?.description || 'Manage your platform'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-purple-200/70 hover:text-white hover:bg-white/10">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm">
                SA
              </div>
            </div>
          </div>
          
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
