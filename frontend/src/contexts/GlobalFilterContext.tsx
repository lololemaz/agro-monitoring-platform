import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  GlobalFilters, 
  defaultGlobalFilters, 
  SavedFilterPreset,
  SmartFilter,
  smartFilters,
  countActiveFilters,
  filtersToUrlParams,
  urlParamsToFilters
} from '@/types/filters';

interface GlobalFilterContextValue {
  filters: GlobalFilters;
  setFilters: (filters: GlobalFilters) => void;
  updateFilter: <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => void;
  resetFilters: () => void;
  resetFilter: <K extends keyof GlobalFilters>(key: K) => void;
  
  // Smart filters
  activeSmartFilter: SmartFilter | null;
  applySmartFilter: (filter: SmartFilter) => void;
  clearSmartFilter: () => void;
  
  // Saved presets
  savedPresets: SavedFilterPreset[];
  savePreset: (name: string, description?: string) => void;
  loadPreset: (preset: SavedFilterPreset) => void;
  deletePreset: (id: string) => void;
  
  // Stats
  activeFilterCount: number;
  
  // URL sync
  syncToUrl: boolean;
  setSyncToUrl: (sync: boolean) => void;
}

const GlobalFilterContext = createContext<GlobalFilterContextValue | null>(null);

export function useGlobalFilters() {
  const context = useContext(GlobalFilterContext);
  if (!context) {
    throw new Error('useGlobalFilters must be used within GlobalFilterProvider');
  }
  return context;
}

interface GlobalFilterProviderProps {
  children: ReactNode;
  syncUrl?: boolean;
}

export function GlobalFilterProvider({ children, syncUrl = true }: GlobalFilterProviderProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [syncToUrl, setSyncToUrl] = useState(syncUrl);
  
  // Initialize filters from URL or defaults
  const [filters, setFiltersState] = useState<GlobalFilters>(() => {
    if (syncUrl) {
      const urlFilters = urlParamsToFilters(searchParams);
      return { ...defaultGlobalFilters, ...urlFilters };
    }
    return defaultGlobalFilters;
  });
  
  const [activeSmartFilter, setActiveSmartFilter] = useState<SmartFilter | null>(null);
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>(() => {
    const stored = localStorage.getItem('filter_presets');
    return stored ? JSON.parse(stored) : [];
  });

  // Sync filters to URL
  useEffect(() => {
    if (syncToUrl) {
      const params = filtersToUrlParams(filters);
      setSearchParams(params, { replace: true });
    }
  }, [filters, syncToUrl, setSearchParams]);

  // Save presets to localStorage
  useEffect(() => {
    localStorage.setItem('filter_presets', JSON.stringify(savedPresets));
  }, [savedPresets]);

  const setFilters = useCallback((newFilters: GlobalFilters) => {
    setFiltersState(newFilters);
    setActiveSmartFilter(null);
  }, []);

  const updateFilter = useCallback(<K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
    setActiveSmartFilter(null);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultGlobalFilters);
    setActiveSmartFilter(null);
  }, []);

  const resetFilter = useCallback(<K extends keyof GlobalFilters>(key: K) => {
    setFiltersState(prev => ({ ...prev, [key]: defaultGlobalFilters[key] }));
  }, []);

  const applySmartFilter = useCallback((filter: SmartFilter) => {
    setFiltersState(prev => ({ ...prev, ...filter.filters }));
    setActiveSmartFilter(filter);
  }, []);

  const clearSmartFilter = useCallback(() => {
    setActiveSmartFilter(null);
    resetFilters();
  }, [resetFilters]);

  const savePreset = useCallback((name: string, description?: string) => {
    const preset: SavedFilterPreset = {
      id: `preset_${Date.now()}`,
      name,
      description,
      filters: { ...filters },
      createdAt: new Date(),
      createdBy: 'Usuário',
    };
    setSavedPresets(prev => [...prev, preset]);
  }, [filters]);

  const loadPreset = useCallback((preset: SavedFilterPreset) => {
    setFiltersState(preset.filters);
    setActiveSmartFilter(null);
  }, []);

  const deletePreset = useCallback((id: string) => {
    setSavedPresets(prev => prev.filter(p => p.id !== id));
  }, []);

  const activeFilterCount = countActiveFilters(filters);

  const value: GlobalFilterContextValue = {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    resetFilter,
    activeSmartFilter,
    applySmartFilter,
    clearSmartFilter,
    savedPresets,
    savePreset,
    loadPreset,
    deletePreset,
    activeFilterCount,
    syncToUrl,
    setSyncToUrl,
  };

  return (
    <GlobalFilterContext.Provider value={value}>
      {children}
    </GlobalFilterContext.Provider>
  );
}
