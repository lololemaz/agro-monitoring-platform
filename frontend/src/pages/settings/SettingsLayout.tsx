import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Building2, MapPin, Users, ChevronRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsNav = [
  {
    title: 'Meu Perfil',
    href: '/settings/profile',
    icon: User,
    description: 'Edite seus dados e senha',
  },
  {
    title: 'Fazendas',
    href: '/settings/farms',
    icon: Building2,
    description: 'Gerencie suas fazendas',
  },
  {
    title: 'Talhões',
    href: '/settings/plots',
    icon: MapPin,
    description: 'Gerencie os talhões das fazendas',
  },
  {
    title: 'Equipe',
    href: '/settings/users',
    icon: Users,
    description: 'Gerencie os usuários da organização',
  },
];

export default function SettingsLayout() {
  const location = useLocation();
  const isSettingsRoot = location.pathname === '/settings';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie fazendas, talhões e equipe da organização
          </p>
        </div>

        {/* Settings root - show cards */}
        {isSettingsRoot ? (
          <div className="grid gap-4 md:grid-cols-3">
            {settingsNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-4 p-6 rounded-lg border bg-card transition-all",
                  "hover:border-primary/50 hover:shadow-md"
                )}
              >
                <div className="p-3 rounded-lg bg-primary/10">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </NavLink>
            ))}
          </div>
        ) : (
          <div className="flex gap-6">
            {/* Sidebar navigation */}
            <aside className="hidden md:block w-56 shrink-0">
              <nav className="space-y-1 sticky top-6">
                {settingsNav.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </NavLink>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 min-w-0">
              <Outlet />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
