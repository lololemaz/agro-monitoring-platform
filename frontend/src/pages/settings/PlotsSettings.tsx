import { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  MapPin, 
  MoreHorizontal, 
  Search,
  TreePine,
  Rows3
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { farmsService } from '@/services/farmsService';
import { plotsService } from '@/services/plotsService';
import { getErrorMessage } from '@/services/api';
import { PolygonEditor } from '@/components/map/PolygonEditor';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Farm } from '@/types/farm';
import type { Plot, PlotCreate, PlotUpdate } from '@/types/plot';

interface FormData {
  farm_id: string;
  name: string;
  code: string;
  area: string;
  crop_type: string;
  variety: string;
  row_count: string;
  tree_count: string;
  season: string;
  coordinates: { lat: number; lng: number } | null;
  polygon: [number, number][];
}

const initialFormData: FormData = {
  farm_id: '',
  name: '',
  code: '',
  area: '',
  crop_type: 'Manga',
  variety: '',
  row_count: '',
  tree_count: '',
  season: '',
  coordinates: null,
  polygon: [],
};

const CROP_TYPES = ['Manga', 'Uva', 'Coco', 'Goiaba', 'Acerola', 'Melão', 'Mamão'];
const MANGO_VARIETIES = ['Tommy Atkins', 'Palmer', 'Kent', 'Keitt', 'Haden', 'Rosa', 'Espada'];

export default function PlotsSettings() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [selectedFarmFilter, setSelectedFarmFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFarms, setIsLoadingFarms] = useState(true);
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    loadPlots();
  }, [selectedFarmFilter]);

  const loadFarms = async () => {
    setIsLoadingFarms(true);
    try {
      const data = await farmsService.getFarms();
      setFarms(data.filter(f => f.is_active));
      // Auto-select first farm if available
      if (data.length > 0 && !selectedFarmFilter) {
        setSelectedFarmFilter(data[0].id);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoadingFarms(false);
    }
  };

  const loadPlots = async () => {
    if (!selectedFarmFilter) {
      setPlots([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await plotsService.getPlots({ farm_id: selectedFarmFilter });
      setPlots(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setPlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered plots
  const filteredPlots = useMemo(() => {
    if (!searchQuery) return plots;
    const query = searchQuery.toLowerCase();
    return plots.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.code?.toLowerCase().includes(query) ||
      p.variety?.toLowerCase().includes(query)
    );
  }, [plots, searchQuery]);

  const getFarmName = (farmId: string) => {
    return farms.find(f => f.id === farmId)?.name || '-';
  };

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      farm_id: selectedFarmFilter || '',
    });
  };

  const validateForm = (): string | null => {
    if (!formData.farm_id) return 'Fazenda é obrigatória';
    if (!formData.name.trim()) return 'Nome é obrigatório';
    if (!formData.area || isNaN(parseFloat(formData.area))) {
      return 'Área deve ser um número válido';
    }
    return null;
  };

  const handleCreate = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    const payload: PlotCreate = {
      farm_id: formData.farm_id,
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      area: parseFloat(formData.area),
      crop_type: formData.crop_type || undefined,
      variety: formData.variety.trim() || undefined,
      row_count: formData.row_count ? parseInt(formData.row_count) : undefined,
      tree_count: formData.tree_count ? parseInt(formData.tree_count) : undefined,
      season: formData.season.trim() || undefined,
      coordinates: formData.polygon.length > 0 
        ? { polygon: formData.polygon }
        : formData.coordinates 
          ? { latitude: formData.coordinates.lat, longitude: formData.coordinates.lng }
          : undefined,
    };

    setIsSaving(true);
    try {
      await plotsService.createPlot(payload);
      toast.success('Talhão criado com sucesso');
      setIsCreateOpen(false);
      resetForm();
      loadPlots();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedPlot) return;
    
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    const payload: PlotUpdate = {
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      area: parseFloat(formData.area),
      crop_type: formData.crop_type || undefined,
      variety: formData.variety.trim() || undefined,
      row_count: formData.row_count ? parseInt(formData.row_count) : undefined,
      tree_count: formData.tree_count ? parseInt(formData.tree_count) : undefined,
      season: formData.season.trim() || undefined,
      coordinates: formData.polygon.length > 0 
        ? { polygon: formData.polygon }
        : formData.coordinates 
          ? { latitude: formData.coordinates.lat, longitude: formData.coordinates.lng }
          : undefined,
    };

    console.log('Atualizando talhao:', selectedPlot.id);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Poligono no form:', formData.polygon);

    setIsSaving(true);
    try {
      await plotsService.updatePlot(selectedPlot.id, payload);
      toast.success('Talhão atualizado com sucesso');
      setIsEditOpen(false);
      resetForm();
      setSelectedPlot(null);
      loadPlots();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPlot) return;

    setIsSaving(true);
    try {
      await plotsService.deletePlot(selectedPlot.id);
      toast.success('Talhão removido com sucesso');
      setIsDeleteOpen(false);
      setSelectedPlot(null);
      loadPlots();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditDialog = (plot: Plot) => {
    setSelectedPlot(plot);
    const coords = plot.coordinates;
    setFormData({
      farm_id: plot.farm_id,
      name: plot.name,
      code: plot.code || '',
      area: plot.area.toString(),
      crop_type: plot.crop_type || 'Manga',
      variety: plot.variety || '',
      row_count: plot.row_count?.toString() || '',
      tree_count: plot.tree_count?.toString() || '',
      season: plot.season || '',
      coordinates: coords?.latitude && coords?.longitude 
        ? { lat: coords.latitude, lng: coords.longitude } 
        : null,
      polygon: coords?.polygon || [],
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (plot: Plot) => {
    setSelectedPlot(plot);
    setIsDeleteOpen(true);
  };

  // Stats
  const stats = useMemo(() => ({
    total: plots.length,
    totalArea: plots.reduce((sum, p) => sum + (Number(p.area) || 0), 0),
    totalTrees: plots.reduce((sum, p) => sum + (Number(p.tree_count) || 0), 0),
  }), [plots]);

  // Centro da fazenda selecionada para o mapa
  const selectedFarmCenter = useMemo((): [number, number] | undefined => {
    const farm = farms.find(f => f.id === formData.farm_id);
    if (farm?.coordinates?.lat && farm?.coordinates?.lng) {
      return [farm.coordinates.lat, farm.coordinates.lng];
    }
    return undefined;
  }, [farms, formData.farm_id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Talhões</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os talhões das suas fazendas
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={farms.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Talhão
        </Button>
      </div>

      {/* Farm Filter */}
      <div className="flex gap-4 items-end">
        <div className="w-64">
          <Label>Fazenda</Label>
          <Select 
            value={selectedFarmFilter || '__none__'} 
            onValueChange={(v) => setSelectedFarmFilter(v === '__none__' ? '' : v)}
            disabled={isLoadingFarms}
          >
            <SelectTrigger>
              <SelectValue placeholder={isLoadingFarms ? "Carregando..." : "Selecione uma fazenda"} />
            </SelectTrigger>
            <SelectContent>
              {farms.length === 0 ? (
                <SelectItem value="__none__" disabled>Nenhuma fazenda</SelectItem>
              ) : (
                farms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id}>
                    {farm.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar talhões..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            disabled={!selectedFarmFilter}
          />
        </div>
      </div>

      {/* Stats */}
      {selectedFarmFilter && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Talhões</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Rows3 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalArea.toFixed(1)} ha</p>
                  <p className="text-xs text-muted-foreground">Área Plantada</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TreePine className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalTrees.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total de Árvores</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      {!selectedFarmFilter ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Selecione uma fazenda para visualizar os talhões
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Variedade</TableHead>
                <TableHead>Árvores</TableHead>
                <TableHead>Safra</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPlots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <MapPin className="w-8 h-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchQuery ? 'Nenhum talhão encontrado' : 'Nenhum talhão cadastrado'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlots.map((plot) => (
                  <TableRow key={plot.id}>
                    <TableCell className="font-medium">{plot.name}</TableCell>
                    <TableCell>
                      {plot.code ? (
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {plot.code}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{plot.area} ha</TableCell>
                    <TableCell>
                      {plot.variety ? (
                        <Badge variant="outline">{plot.variety}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{plot.tree_count?.toLocaleString() || '-'}</TableCell>
                    <TableCell>{plot.season || '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(plot)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(plot)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Novo Talhão</DialogTitle>
            <DialogDescription>
              Cadastre um novo talhão
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="grid gap-4 py-4 pr-4">
            <div className="grid gap-2">
              <Label>Fazenda *</Label>
              <Select 
                value={formData.farm_id} 
                onValueChange={(v) => setFormData({ ...formData, farm_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a fazenda" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: T01, Talhão Norte"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: T01"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="area">Área (ha) *</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.01"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="Ex: 4.5"
                />
              </div>
              <div className="grid gap-2">
                <Label>Cultura</Label>
                <Select 
                  value={formData.crop_type} 
                  onValueChange={(v) => setFormData({ ...formData, crop_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_TYPES.map((crop) => (
                      <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Variedade</Label>
                <Select 
                  value={formData.variety || '__none__'} 
                  onValueChange={(v) => setFormData({ ...formData, variety: v === '__none__' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    {MANGO_VARIETIES.map((variety) => (
                      <SelectItem key={variety} value={variety}>{variety}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="season">Safra</Label>
                <Input
                  id="season"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  placeholder="Ex: 2024/2025"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="row_count">Nº de Linhas</Label>
                <Input
                  id="row_count"
                  type="number"
                  value={formData.row_count}
                  onChange={(e) => setFormData({ ...formData, row_count: e.target.value })}
                  placeholder="Ex: 20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tree_count">Nº de Árvores</Label>
                <Input
                  id="tree_count"
                  type="number"
                  value={formData.tree_count}
                  onChange={(e) => setFormData({ ...formData, tree_count: e.target.value })}
                  placeholder="Ex: 400"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Area do Talhao (desenhe no mapa)</Label>
              <PolygonEditor
                center={selectedFarmCenter}
                defaultPolygon={formData.polygon}
                onPolygonChange={(polygon) => setFormData({ ...formData, polygon })}
                onAreaChange={(areaHa) => {
                  if (areaHa > 0) {
                    setFormData(prev => ({ ...prev, area: areaHa.toString() }));
                  }
                }}
              />
            </div>
          </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? 'Criando...' : 'Criar Talhão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar Talhão</DialogTitle>
            <DialogDescription>
              Atualize os dados do talhão
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="grid gap-4 py-4 pr-4">
            <div className="grid gap-2">
              <Label>Fazenda</Label>
              <Input value={getFarmName(formData.farm_id)} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: T01, Talhão Norte"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-code">Código</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: T01"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-area">Área (ha) *</Label>
                <Input
                  id="edit-area"
                  type="number"
                  step="0.01"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="Ex: 4.5"
                />
              </div>
              <div className="grid gap-2">
                <Label>Cultura</Label>
                <Select 
                  value={formData.crop_type} 
                  onValueChange={(v) => setFormData({ ...formData, crop_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_TYPES.map((crop) => (
                      <SelectItem key={crop} value={crop}>{crop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Variedade</Label>
                <Select 
                  value={formData.variety || '__none__'} 
                  onValueChange={(v) => setFormData({ ...formData, variety: v === '__none__' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    {MANGO_VARIETIES.map((variety) => (
                      <SelectItem key={variety} value={variety}>{variety}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-season">Safra</Label>
                <Input
                  id="edit-season"
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  placeholder="Ex: 2024/2025"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-row_count">Nº de Linhas</Label>
                <Input
                  id="edit-row_count"
                  type="number"
                  value={formData.row_count}
                  onChange={(e) => setFormData({ ...formData, row_count: e.target.value })}
                  placeholder="Ex: 20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tree_count">Nº de Árvores</Label>
                <Input
                  id="edit-tree_count"
                  type="number"
                  value={formData.tree_count}
                  onChange={(e) => setFormData({ ...formData, tree_count: e.target.value })}
                  placeholder="Ex: 400"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Area do Talhao (desenhe no mapa)</Label>
              <PolygonEditor
                center={selectedFarmCenter}
                defaultPolygon={formData.polygon}
                onPolygonChange={(polygon) => setFormData({ ...formData, polygon })}
                onAreaChange={(areaHa) => {
                  if (areaHa > 0) {
                    setFormData(prev => ({ ...prev, area: areaHa.toString() }));
                  }
                }}
              />
            </div>
          </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o talhão "{selectedPlot?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
