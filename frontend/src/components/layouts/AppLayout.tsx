import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, 
  LayoutDashboard,
  Map,
  Calendar,
  BarChart3,
  Bell,
  LogOut, 
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Building2,
  Settings,
  User,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useFarm } from '@/contexts/FarmContext';
import { OrganizationSelectorPage } from '@/components/OrganizationSelector';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Dashboard',
    href: '/farm',
    icon: LayoutDashboard,
    end: true,
  },
  {
    title: 'Heatmap',
    href: '/heatmap',
    icon: Map,
  },
  {
    title: 'Eventos',
    href: '/events',
    icon: Calendar,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Configurações',
    href: '/settings',
    icon: Settings,
  },
];

export function AppLayout() {
  const { user, logout, isSuperuser } = useAuth();
  const { 
    organizations, 
    selectedOrganization, 
    selectOrganization, 
    isLoading: orgsLoading,
    needsOrgSelection,
    isSuperadminMode 
  } = useOrganization();
  const { farms, selectedFarm, selectFarm, isLoading: farmsLoading } = useFarm();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitials = user 
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.email[0].toUpperCase()
    : 'U';

  const userName = user?.first_name 
    ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
    : user?.email?.split('@')[0] || 'Usuário';

  // Superadmin needs to select organization first
  if (needsOrgSelection) {
    return <OrganizationSelectorPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-200 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Activity className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Kernova AgOS</span>
              <span className="text-xs text-muted-foreground">Monitoramento</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Organization Selector (Superadmin only) */}
          {isSuperadminMode && (
            <div className="px-3 py-3 border-b border-border">
              <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Organização
              </label>
              {orgsLoading ? (
                <div className="h-10 bg-muted animate-pulse rounded-md" />
              ) : (
                <Select 
                  value={selectedOrganization?.id || ''} 
                  onValueChange={selectOrganization}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione">
                      {selectedOrganization && (
                        <span className="truncate">{selectedOrganization.name}</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Farm Selector */}
          <div className="px-3 py-3 border-b border-border">
            <label className="text-xs text-muted-foreground mb-2 block">Fazenda</label>
            {farmsLoading ? (
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            ) : farms.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2">
                {isSuperadminMode && !selectedOrganization 
                  ? 'Selecione uma organização'
                  : 'Nenhuma fazenda disponível'
                }
              </div>
            ) : (
              <Select 
                value={selectedFarm?.id || ''} 
                onValueChange={selectFarm}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma fazenda">
                    {selectedFarm && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{selectedFarm.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span>{farm.name}</span>
                          {farm.total_area && (
                            <span className="text-xs text-muted-foreground">
                              {farm.total_area} ha
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.title}
                </NavLink>
              ))}
            </nav>
          </ScrollArea>

          <Separator />

          {/* User section */}
          <div className="p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-6">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm flex-1 min-w-0">
                    <span className="font-medium truncate w-full text-left">
                      {userName}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full text-left flex items-center gap-1">
                      {isSuperuser && <Shield className="w-3 h-3" />}
                      {isSuperuser ? 'Superadmin' : 'Usuário'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isSuperuser && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Área Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem disabled>
                  <User className="w-4 h-4 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-background/95 backdrop-blur border-b border-border lg:px-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* Breadcrumb or page title */}
          <div className="flex-1 flex items-center gap-2 ml-2 lg:ml-0">
            {isSuperadminMode && selectedOrganization && (
              <>
                <Badge variant="outline" className="hidden sm:flex gap-1">
                  <Building2 className="w-3 h-3" />
                  {selectedOrganization.name}
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:inline" />
              </>
            )}
            {selectedFarm && (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {selectedFarm.name}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:inline" />
              </>
            )}
            <span className="font-medium">
              {navItems.find(item => {
                if (item.end) {
                  return location.pathname === item.href;
                }
                return location.pathname.startsWith(item.href);
              })?.title || 'Dashboard'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {/* TODO: Replace with real alerts count */}
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              >
                3
              </Badge>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
