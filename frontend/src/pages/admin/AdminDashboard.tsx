import { useEffect, useState } from 'react';
import { Building2, Cpu, Users, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminService } from '@/services/adminService';
import type { Organization } from '@/types/organization';
import type { SensorType } from '@/types/sensor';

interface DashboardStats {
  organizations: number;
  sensorTypes: number;
  isLoading: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    organizations: 0,
    sensorTypes: 0,
    isLoading: true,
  });
  const [recentOrgs, setRecentOrgs] = useState<Organization[]>([]);
  const [recentSensorTypes, setRecentSensorTypes] = useState<SensorType[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [orgs, types] = await Promise.all([
          adminService.getOrganizations(),
          adminService.getSensorTypes(),
        ]);

        setStats({
          organizations: orgs.length,
          sensorTypes: types.length,
          isLoading: false,
        });

        setRecentOrgs(orgs.slice(0, 5));
        setRecentSensorTypes(types.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema e recursos gerenciados
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizações</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.isLoading ? '...' : stats.organizations}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de organizações cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Sensor</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.isLoading ? '...' : stats.sensorTypes}
            </div>
            <p className="text-xs text-muted-foreground">
              Tipos de sensor disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Superusuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Administradores do sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Online</div>
            <p className="text-xs text-muted-foreground">
              Sistema operando normalmente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Organizations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organizações Recentes</CardTitle>
            <CardDescription>Últimas organizações cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : recentOrgs.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Nenhuma organização cadastrada
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrgs.map((org) => (
                  <div key={org.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{org.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {org.company_name || org.email || 'Sem detalhes'}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      org.is_active 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {org.is_active ? 'Ativa' : 'Inativa'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sensor Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos de Sensor</CardTitle>
            <CardDescription>Tipos de sensor disponíveis no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.isLoading ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : recentSensorTypes.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Nenhum tipo de sensor cadastrado
              </div>
            ) : (
              <div className="space-y-3">
                {recentSensorTypes.map((type) => (
                  <div key={type.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Cpu className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{type.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {type.category} • {type.slug}
                      </p>
                    </div>
                    <div className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                      {type.supported_metrics?.length || 0} métricas
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
