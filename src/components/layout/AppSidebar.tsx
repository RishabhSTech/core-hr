import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  Building2,
  LogOut,
  User,
  ChevronRight,
  Settings,
  CreditCard
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const getNavItems = (role: string | null, isAdmin: boolean) => {
  const baseItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  ];

  if (isAdmin) {
    const adminItems = [
      ...baseItems,
      { title: 'Employees', url: '/employees', icon: Users },
      { title: 'Attendance', url: '/attendance', icon: Clock },
      { title: 'Leave Management', url: '/leaves', icon: Calendar },
    ];
    
    // Only owner can see Payroll and Billing
    if (role === 'owner') {
      adminItems.push(
        { title: 'Payroll', url: '/payroll', icon: DollarSign },
        { title: 'Billing', url: '/billing', icon: CreditCard }
      );
    }
    
    adminItems.push(
      { title: 'Org Chart', url: '/org-chart', icon: Building2 },
      { title: 'Settings', url: '/settings', icon: Settings }
    );
    
    return adminItems;
  }

  // Employee/Manager items
  return [
    ...baseItems,
    { title: 'My Attendance', url: '/attendance', icon: Clock },
    { title: 'My Leaves', url: '/leaves', icon: Calendar },
    { title: 'Org Chart', url: '/org-chart', icon: Building2 },
  ];
};

export function AppSidebar() {
  const { profile, role, signOut, isAdmin } = useAuth();
  const items = getNavItems(role, isAdmin);

  const getInitials = () => {
    if (!profile) return 'U';
    return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'owner': return 'Owner';
      case 'admin': return 'Admin';
      case 'manager': return 'Manager';
      default: return 'Employee';
    }
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-primary-foreground font-bold shadow-lg shadow-primary/25">
            C
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-foreground leading-tight">CoreHR</h1>
            <p className="text-[10px] text-muted-foreground leading-none">by Shrijan Technologies</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
          </div>
          <NavLink to="/profile">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </NavLink>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2" 
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
