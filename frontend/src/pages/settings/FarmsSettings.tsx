import { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Building2, 
  MoreHorizontal, 
  Search,
  MapPin,
  Activity
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { farmsService } from '@/services/farmsService';
import { getErrorMessage } from '@/services/api';
import { useFarm } from '@/contexts/FarmContext';
import type { Farm, FarmCreate, FarmUpdate } from '@/types/farm';

interface FormData {
  name: string;
  code: string;
  total_area: string;
  address: string;
  timezone: string;
}

const initialFormData: FormData = {
  name: '',
  code: '',
  total_area: '',
  address: '',
  timezone: 'America/Sao_Paulo',
};

export default function FarmsSettings() {
  const { refreshFarms } = useFarm();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    loadFarms();
  }, []);

  const loadFarms = async () => {
    setIsLoading(true);
    try {
      const data = await farmsService.getFarms();
      setFarms(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered farms
  const filteredFarms = useMemo(() => {
    if (!searchQuery) return farms;
    const query = searchQuery.toLowerCase();
    return farms.filter(f => 
      f.name.toLowerCase().includes(query) ||
      f.code?.toLowerCase().includes(query) ||
      f.address?.toLowerCase().includes(query)
    );
  }, [farms, searchQuery]);

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Nome é obrigatório';
    if (formData.total_area && isNaN(parseFloat(formData.total_area))) {
      return 'Área total deve ser um número válido';
    }
    return null;
  };

  const handleCreate = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    const payload: FarmCreate = {
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      total_area: formData.total_area ? parseFloat(formData.total_area) : undefined,
      address: formData.address.trim() || undefined,
      timezone: formData.timezone || undefined,
    };

    setIsSaving(true);
    try {
      await farmsService.createFarm(payload);
      toast.success('Fazenda criada com sucesso');
      setIsCreateOpen(false);
      resetForm();
      loadFarms();
      refreshFarms();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedFarm) return;
    
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    const payload: FarmUpdate = {
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      total_area: formData.total_area ? parseFloat(formData.total_area) : undefined,
      address: formData.address.trim() || undefined,
      timezone: formData.timezone || undefined,
    };

    setIsSaving(true);
    try {
      await farmsService.updateFarm(selectedFarm.id, payload);
      toast.success('Fazenda atualizada com sucesso');
      setIsEditOpen(false);
      resetForm();
      setSelectedFarm(null);
      loadFarms();
      refreshFarms();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFarm) return;

    setIsSaving(true);
    try {
      await farmsService.deleteFarm(selectedFarm.id);
      toast.success('Fazenda removida com sucesso');
      setIsDeleteOpen(false);
      setSelectedFarm(null);
      loadFarms();
      refreshFarms();
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

  const openEditDialog = (farm: Farm) => {
    setSelectedFarm(farm);
    setFormData({
      name: farm.name,
      code: farm.code || '',
      total_area: farm.total_area?.toString() || '',
      address: farm.address || '',
      timezone: farm.timezone || 'America/Sao_Paulo',
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (farm: Farm) => {
    setSelectedFarm(farm);
    setIsDeleteOpen(true);
  };

  // Stats
  const stats = useMemo(() => ({
    total: farms.length,
    active: farms.filter(f => f.is_active).length,
    totalArea: farms.reduce((sum, f) => sum + (f.total_area || 0), 0),
  }), [farms]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Fazendas</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie as fazendas da sua organização
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Fazenda
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de Fazendas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MapPin className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Number(stats.totalArea || 0).toFixed(0)} ha</p>
                <p className="text-xs text-muted-foreground">Área Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar fazendas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Carregando...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredFarms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Nenhuma fazenda encontrada' : 'Nenhuma fazenda cadastrada'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredFarms.map((farm) => (
                <TableRow key={farm.id}>
                  <TableCell className="font-medium">{farm.name}</TableCell>
                  <TableCell>
                    {farm.code ? (
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {farm.code}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {farm.total_area ? `${farm.total_area} ha` : '-'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {farm.address || '-'}
                  </TableCell>
                  <TableCell>
                    {farm.is_active ? (
                      <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                        Ativa
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(farm)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(farm)}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Fazenda</DialogTitle>
            <DialogDescription>
              Cadastre uma nova fazenda na organização
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Fazenda Santa Helena"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: FSH-001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="total_area">Área Total (ha)</Label>
                <Input
                  id="total_area"
                  type="number"
                  step="0.01"
                  value={formData.total_area}
                  onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                  placeholder="Ex: 200"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ex: Rodovia BR-101, km 45, Petrolina-PE"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? 'Criando...' : 'Criar Fazenda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Fazenda</DialogTitle>
            <DialogDescription>
              Atualize os dados da fazenda
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Fazenda Santa Helena"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-code">Código</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: FSH-001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-total_area">Área Total (ha)</Label>
                <Input
                  id="edit-total_area"
                  type="number"
                  step="0.01"
                  value={formData.total_area}
                  onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                  placeholder="Ex: 200"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Endereço</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ex: Rodovia BR-101, km 45, Petrolina-PE"
              />
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
              Tem certeza que deseja excluir a fazenda "{selectedFarm?.name}"?
              Esta ação não pode ser desfeita e removerá todos os talhões e dados associados.
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
