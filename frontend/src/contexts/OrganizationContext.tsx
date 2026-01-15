import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode 
} from 'react';
import { adminService } from '@/services/adminService';
import { useAuth } from './AuthContext';
import type { Organization } from '@/types/organization';

const SELECTED_ORG_KEY = 'selected_organization_id';

interface OrganizationContextValue {
  // State
  organizations: Organization[];
  selectedOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
  
  // For superadmins: the selected org ID to use in API calls
  // For normal users: their own org ID from the token
  effectiveOrganizationId: string | null;
  
  // Actions
  selectOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
  clearSelection: () => void;
  
  // Helpers
  isSuperadminMode: boolean;
  needsOrgSelection: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}

interface OrganizationProviderProps {
  children: ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { isAuthenticated, user, isSuperuser } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Superadmins need to select an org, normal users use their own
  const isSuperadminMode = isSuperuser;
  
  // Effective org ID for API calls
  const effectiveOrganizationId = isSuperadminMode 
    ? selectedOrganization?.id || null
    : user?.organization_id || null;

  // Superadmin needs to select an org before using the app
  const needsOrgSelection = isSuperadminMode && !selectedOrganization && !isLoading;

  // Load organizations for superadmins
  useEffect(() => {
    if (isAuthenticated && isSuperuser) {
      loadOrganizations();
    } else {
      setOrganizations([]);
      setSelectedOrganization(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, isSuperuser]);

  const loadOrganizations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await adminService.getOrganizations();
      setOrganizations(data.filter(org => org.is_active));
      
      // Try to restore previous selection
      const savedOrgId = localStorage.getItem(SELECTED_ORG_KEY);
      if (savedOrgId) {
        const savedOrg = data.find(o => o.id === savedOrgId && o.is_active);
        if (savedOrg) {
          setSelectedOrganization(savedOrg);
        }
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setError('Falha ao carregar organizações');
    } finally {
      setIsLoading(false);
    }
  };

  const selectOrganization = useCallback((orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setSelectedOrganization(org);
      localStorage.setItem(SELECTED_ORG_KEY, orgId);
    }
  }, [organizations]);

  const refreshOrganizations = useCallback(async () => {
    await loadOrganizations();
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedOrganization(null);
    localStorage.removeItem(SELECTED_ORG_KEY);
  }, []);

  const value: OrganizationContextValue = {
    organizations,
    selectedOrganization,
    isLoading,
    error,
    effectiveOrganizationId,
    selectOrganization,
    refreshOrganizations,
    clearSelection,
    isSuperadminMode,
    needsOrgSelection,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}
