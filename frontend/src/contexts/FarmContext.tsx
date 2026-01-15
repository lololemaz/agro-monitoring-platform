import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode 
} from 'react';
import { farmsService } from '@/services/farmsService';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';
import type { Farm } from '@/types/farm';

const SELECTED_FARM_KEY = 'selected_farm_id';

interface FarmContextValue {
  // State
  farms: Farm[];
  selectedFarm: Farm | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  selectFarm: (farmId: string) => void;
  refreshFarms: () => Promise<void>;
  clearSelection: () => void;
  
  // Helpers
  hasFarms: boolean;
  needsFarmSelection: boolean;
}

const FarmContext = createContext<FarmContextValue | null>(null);

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within FarmProvider');
  }
  return context;
}

/**
 * Hook to ensure a farm is selected, with loading state
 */
export function useRequiredFarm() {
  const { selectedFarm, isLoading, farms, needsFarmSelection } = useFarm();
  
  return {
    farm: selectedFarm,
    isLoading,
    hasFarms: farms.length > 0,
    needsSelection: needsFarmSelection,
    noFarms: !isLoading && farms.length === 0,
  };
}

interface FarmProviderProps {
  children: ReactNode;
}

export function FarmProvider({ children }: FarmProviderProps) {
  const { isAuthenticated } = useAuth();
  const { effectiveOrganizationId, needsOrgSelection, isSuperadminMode } = useOrganization();
  
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasFarms = farms.length > 0;
  const needsFarmSelection = !isLoading && hasFarms && !selectedFarm;

  // Load farms when we have an effective organization
  useEffect(() => {
    // Don't load if not authenticated
    if (!isAuthenticated) {
      setFarms([]);
      setSelectedFarm(null);
      setIsLoading(false);
      return;
    }

    // Superadmin needs to select org first
    if (isSuperadminMode && !effectiveOrganizationId) {
      setFarms([]);
      setSelectedFarm(null);
      setIsLoading(false);
      return;
    }

    // Normal user without org (shouldn't happen but handle it)
    if (!isSuperadminMode && !effectiveOrganizationId) {
      setFarms([]);
      setSelectedFarm(null);
      setIsLoading(false);
      return;
    }

    loadFarms();
  }, [isAuthenticated, effectiveOrganizationId, isSuperadminMode]);

  const loadFarms = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For superadmins, we need to pass the org_id
      // The backend should filter by org_id for superusers
      const data = await farmsService.getFarms();
      
      // Filter by effective org if needed (backend might already do this)
      const filteredFarms = effectiveOrganizationId 
        ? data.filter(f => f.organization_id === effectiveOrganizationId)
        : data;
      
      setFarms(filteredFarms);
      
      // Try to restore previous selection
      const savedFarmId = localStorage.getItem(SELECTED_FARM_KEY);
      if (savedFarmId) {
        const savedFarm = filteredFarms.find(f => f.id === savedFarmId);
        if (savedFarm) {
          setSelectedFarm(savedFarm);
        } else if (filteredFarms.length > 0) {
          // Saved farm not found or from different org, select first
          setSelectedFarm(filteredFarms[0]);
          localStorage.setItem(SELECTED_FARM_KEY, filteredFarms[0].id);
        } else {
          setSelectedFarm(null);
        }
      } else if (filteredFarms.length > 0) {
        // No saved selection, select first farm
        setSelectedFarm(filteredFarms[0]);
        localStorage.setItem(SELECTED_FARM_KEY, filteredFarms[0].id);
      } else {
        setSelectedFarm(null);
      }
    } catch (err) {
      console.error('Failed to load farms:', err);
      setError('Falha ao carregar fazendas');
      setFarms([]);
      setSelectedFarm(null);
    } finally {
      setIsLoading(false);
    }
  };

  const selectFarm = useCallback((farmId: string) => {
    const farm = farms.find(f => f.id === farmId);
    if (farm) {
      setSelectedFarm(farm);
      localStorage.setItem(SELECTED_FARM_KEY, farmId);
    }
  }, [farms]);

  const refreshFarms = useCallback(async () => {
    await loadFarms();
  }, [effectiveOrganizationId]);

  const clearSelection = useCallback(() => {
    setSelectedFarm(null);
    localStorage.removeItem(SELECTED_FARM_KEY);
  }, []);

  const value: FarmContextValue = {
    farms,
    selectedFarm,
    isLoading,
    error,
    selectFarm,
    refreshFarms,
    clearSelection,
    hasFarms,
    needsFarmSelection,
  };

  return (
    <FarmContext.Provider value={value}>
      {children}
    </FarmContext.Provider>
  );
}
