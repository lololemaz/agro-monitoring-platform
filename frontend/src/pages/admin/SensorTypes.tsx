import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Cpu, MoreHorizontal, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { adminService } from '@/services/adminService';
import { getErrorMessage } from '@/services/api';
import type { SensorType, SensorTypeCreate, SensorCategory } from '@/types/sensor';

const CATEGORIES: { value: SensorCategory; label: string }[] = [
  { value: 'soil', label: 'Solo' },
  { value: 'weather', label: 'Clima' },
  { value: 'camera', label: 'Câmera' },
  { value: 'irrigation', label: 'Irrigação' },
];

const DEFAULT_METRICS: Record<SensorCategory, string[]> = {
  soil: ['moisture', 'temperature', 'ec', 'ph', 'nitrogen', 'phosphorus', 'potassium'],
  weather: ['temperature', 'humidity', 'pressure', 'wind_speed', 'rainfall', 'solar_radiation'],
  camera: ['fruit_count', 'avg_fruit_size', 'flowering_percentage', 'pests_detected', 'ndvi'],
  irrigation: ['flow_rate', 'pressure', 'water_level', 'valve_status'],
};

export default function SensorTypes() {
  const [sensorTypes, setSensorTypes] = useState<SensorType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<SensorType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<SensorType | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<SensorTypeCreate>({
    name: '',
    slug: '',
    category: 'soil',
    description: '',
    manufacturer: '',
    model: '',
    supported_metrics: [],
  });
  const [metricsInput, setMetricsInput] = useState('');

  useEffect(() => {
    loadSensorTypes();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredTypes(
        sensorTypes.filter(
          type =>
            type.name.toLowerCase().includes(query) ||
            type.slug.toLowerCase().includes(query) ||
            type.category.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredTypes(sensorTypes);
    }
  }, [searchQuery, sensorTypes]);

  const loadSensorTypes = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getSensorTypes();
      setSensorTypes(data);
      setFilteredTypes(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      category: 'soil',
      description: '',
      manufacturer: '',
      model: '',
      supported_metrics: [],
    });
    setMetricsInput('');
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleCategoryChange = (category: SensorCategory) => {
    const defaultMetrics = DEFAULT_METRICS[category] || [];
    setFormData({ ...formData, category, supported_metrics: defaultMetrics });
    setMetricsInput(defaultMetrics.join(', '));
  };

  const parseMetrics = (input: string): string[] => {
    return input
      .split(',')
      .map(m => m.trim().toLowerCase().replace(/\s+/g, '_'))
      .filter(m => m.length > 0);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Nome e slug são obrigatórios');
      return;
    }

    const metrics = parseMetrics(metricsInput);
    
    setIsSaving(true);
    try {
      await adminService.createSensorType({
        ...formData,
        supported_metrics: metrics,
      });
      toast.success('Tipo de sensor criado com sucesso');
      setIsCreateOpen(false);
      resetForm();
      loadSensorTypes();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedType || !formData.name.trim() || !formData.slug.trim()) {
      toast.error('Nome e slug são obrigatórios');
      return;
    }

    const metrics = parseMetrics(metricsInput);

    setIsSaving(true);
    try {
      await adminService.updateSensorType(selectedType.id, {
        ...formData,
        supported_metrics: metrics,
      });
      toast.success('Tipo de sensor atualizado com sucesso');
      setIsEditOpen(false);
      resetForm();
      setSelectedType(null);
      loadSensorTypes();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedType) return;

    setIsSaving(true);
    try {
      await adminService.deleteSensorType(selectedType.id);
      toast.success('Tipo de sensor removido com sucesso');
      setIsDeleteOpen(false);
      setSelectedType(null);
      loadSensorTypes();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (type: SensorType) => {
    setSelectedType(type);
    setFormData({
      name: type.name,
      slug: type.slug,
      category: type.category,
      description: type.description || '',
      manufacturer: type.manufacturer || '',
      model: type.model || '',
      supported_metrics: type.supported_metrics || [],
    });
    setMetricsInput((type.supported_metrics || []).join(', '));
    setIsEditOpen(true);
  };

  const openDeleteDialog = (type: SensorType) => {
    setSelectedType(type);
    setIsDeleteOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    const defaultMetrics = DEFAULT_METRICS['soil'];
    setFormData(prev => ({ ...prev, supported_metrics: defaultMetrics }));
    setMetricsInput(defaultMetrics.join(', '));
    setIsCreateOpen(true);
  };

  const getCategoryLabel = (category: SensorCategory) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tipos de Sensor</h1>
          <p className="text-muted-foreground">
            Gerencie os tipos de sensores disponíveis no sistema
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tipos de sensor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Métricas</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Carregando...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Cpu className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Nenhum tipo encontrado' : 'Nenhum tipo de sensor cadastrado'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>
                    <code className="px-2 py-1 bg-muted rounded text-xs">
                      {type.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getCategoryLabel(type.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {type.supported_metrics?.length || 0} métricas
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(type)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(type)}
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

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Novo Tipo de Sensor</DialogTitle>
            <DialogDescription>
              Defina um novo tipo de sensor para o sistema
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Sensor de Solo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="sensor_de_solo"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleCategoryChange(value as SensorCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="manufacturer">Fabricante</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="Ex: Acme Sensors"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Ex: SS-1000"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do tipo de sensor"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="metrics">Métricas Suportadas</Label>
              <Textarea
                id="metrics"
                value={metricsInput}
                onChange={(e) => setMetricsInput(e.target.value)}
                placeholder="moisture, temperature, ph (separadas por vírgula)"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Separe as métricas por vírgula. Ex: moisture, temperature, ec, ph
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Editar Tipo de Sensor</DialogTitle>
            <DialogDescription>
              Atualize os dados do tipo de sensor
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Sensor de Solo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-slug">Slug *</Label>
                <Input
                  id="edit-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="sensor_de_solo"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleCategoryChange(value as SensorCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-manufacturer">Fabricante</Label>
                <Input
                  id="edit-manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="Ex: Acme Sensors"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-model">Modelo</Label>
                <Input
                  id="edit-model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Ex: SS-1000"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do tipo de sensor"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-metrics">Métricas Suportadas</Label>
              <Textarea
                id="edit-metrics"
                value={metricsInput}
                onChange={(e) => setMetricsInput(e.target.value)}
                placeholder="moisture, temperature, ph (separadas por vírgula)"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Separe as métricas por vírgula. Ex: moisture, temperature, ec, ph
              </p>
            </div>
          </div>
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
              Tem certeza que deseja excluir o tipo de sensor "{selectedType?.name}"?
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
