import { Building2, ChevronDown, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Organization selector dropdown for sidebar
 */
export function OrganizationSelectorDropdown() {
  const { 
    organizations, 
    selectedOrganization, 
    selectOrganization, 
    isLoading,
    isSuperadminMode 
  } = useOrganization();

  // Only show for superadmins
  if (!isSuperadminMode) return null;

  return (
    <div className="px-3 py-3 border-b border-border">
      <label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
        <Building2 className="w-3 h-3" />
        Organização
      </label>
      {isLoading ? (
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      ) : organizations.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2">
          Nenhuma organização
        </div>
      ) : (
        <Select 
          value={selectedOrganization?.id || ''} 
          onValueChange={selectOrganization}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione uma organização">
              {selectedOrganization && (
                <span className="truncate">{selectedOrganization.name}</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                <div className="flex flex-col">
                  <span>{org.name}</span>
                  {org.company_name && (
                    <span className="text-xs text-muted-foreground">
                      {org.company_name}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

/**
 * Full-page organization selector (shown when superadmin needs to select org)
 */
export function OrganizationSelectorPage() {
  const navigate = useNavigate();
  const { 
    organizations, 
    selectOrganization, 
    isLoading 
  } = useOrganization();

  const handleSelect = (orgId: string) => {
    selectOrganization(orgId);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Selecione uma Organização</CardTitle>
          <CardDescription>
            Como superadmin, escolha qual organização você deseja visualizar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Nenhuma organização cadastrada
              </p>
              <Button onClick={() => navigate('/admin/organizations')}>
                Criar Organização
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => handleSelect(org.id)}
                  className="w-full p-4 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-colors text-left flex items-center gap-4"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{org.name}</div>
                    {org.company_name && (
                      <div className="text-sm text-muted-foreground truncate">
                        {org.company_name}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {org.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border flex justify-center">
            <Button variant="outline" onClick={() => navigate('/admin')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Voltar para Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OrganizationSelectorDropdown;
