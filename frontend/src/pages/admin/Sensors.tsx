import { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Cpu, 
  MoreHorizontal, 
  Search,
  Building2,
  MapPin,
  Wifi,
  WifiOff,
  Battery,
  Signal
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminService, type AdminSensorCreate, type AdminSensorUpdate } from '@/services/adminService';
import { farmsService } from '@/services/farmsService';
import { plotsService } from '@/services/plotsService';
import { getErrorMessage } from '@/services/api';
import type { Organization } from '@/types/organization';
import type { Sensor, SensorType } from '@/types/sensor';
import type { Farm } from '@/types/farm';
import type { Plot } from '@/types/plot';

interface FormData {
  name: string;
  sensor_type_id: string;
  farm_id: string;
  plot_id: string;
  serial_number: string;
  mac_address: string;
  firmware_version: string;
  location_description: string;
}

const initialFormData: FormData = {
  name: '',
  sensor_type_id: '',
  farm_id: '',
  plot_id: '',
  serial_number: '',
  mac_address: '',
  firmware_version: '',
  location_description: '',
};

export default function Sensors() {
  // Data states
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sensorTypes, setSensorTypes] = useState<SensorType[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  
  // Filter states
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSensors, setIsLoadingSensors] = useState(false);
  const [isLoadingFarms, setIsLoadingFarms] = useState(false);
  const [isLoadingPlots, setIsLoadingPlots] = useState(false);
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load farms when org changes
  useEffect(() => {
    if (selectedOrgId) {
      loadFarms(selectedOrgId);
      loadSensors();
    } else {
      setFarms([]);
      setSensors([]);
      setSelectedFarmId('');
    }
  }, [selectedOrgId]);

  // Load plots when farm changes in form
  useEffect(() => {
    if (formData.farm_id) {
      loadPlots(formData.farm_id);
    } else {
      setPlots([]);
    }
  }, [formData.farm_id]);

  // Load sensors when farm filter changes
  useEffect(() => {
    if (selectedOrgId) {
      loadSensors();
    }
  }, [selectedFarmId]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [orgs, types] = await Promise.all([
        adminService.getOrganizations(),
        adminService.getSensorTypes(),
      ]);
      setOrganizations(orgs.filter(o => o.is_active));
      setSensorTypes(types.filter(t => t.is_active));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const loadFarms = async (orgId: string) => {
    setIsLoadingFarms(true);
    try {
      const data = await farmsService.getFarms();
      // Filter by org since backend might return all for superuser
      setFarms(data.filter(f => f.organization_id === orgId));
    } catch (error) {
      toast.error(getErrorMessage(error));
      setFarms([]);
    } finally {
      setIsLoadingFarms(false);
    }
  };

  const loadPlots = async (farmId: string) => {
    setIsLoadingPlots(true);
    try {
      const data = await plotsService.getPlots({ farm_id: farmId });
      setPlots(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setPlots([]);
    } finally {
      setIsLoadingPlots(false);
    }
  };

  const loadSensors = async () => {
    if (!selectedOrgId) return;
    
    setIsLoadingSensors(true);
    try {
      const data = await adminService.getSensors(
        selectedOrgId,
        selectedFarmId || undefined,
      );
      setSensors(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setSensors([]);
    } finally {
      setIsLoadingSensors(false);
    }
  };

  // Filtered sensors
  const filteredSensors = useMemo(() => {
    if (!searchQuery) return sensors;
    const query = searchQuery.toLowerCase();
    return sensors.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.serial_number?.toLowerCase().includes(query) ||
      s.mac_address?.toLowerCase().includes(query)
    );
  }, [sensors, searchQuery]);

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      farm_id: selectedFarmId || '',
    });
    setPlots([]);
  };

  const getSensorTypeName = (typeId: string) => {
    return sensorTypes.find(t => t.id === typeId)?.name || 'Desconhecido';
  };

  const getFarmName = (farmId: string | null) => {
    if (!farmId) return '-';
    return farms.find(f => f.id === farmId)?.name || '-';
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Nome é obrigatório';
    if (!formData.sensor_type_id) return 'Tipo de sensor é obrigatório';
    if (!formData.farm_id) return 'Fazenda é obrigatória';
    return null;
  };

  const handleCreate = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    const payload: AdminSensorCreate = {
      name: formData.name.trim(),
      sensor_type_id: formData.sensor_type_id,
      farm_id: formData.farm_id || undefined,
      plot_id: formData.plot_id || undefined,
      serial_number: formData.serial_number.trim() || undefined,
      mac_address: formData.mac_address.trim() || undefined,
      firmware_version: formData.firmware_version.trim() || undefined,
      location: formData.location_description.trim() 
        ? { description: formData.location_description.trim() }
        : undefined,
    };

    setIsSaving(true);
    try {
      await adminService.createSensor(selectedOrgId, payload);
      toast.success('Sensor criado com sucesso');
      setIsCreateOpen(false);
      resetForm();
      loadSensors();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedSensor) return;
    
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    const payload: AdminSensorUpdate = {
      name: formData.name.trim(),
      sensor_type_id: formData.sensor_type_id,
      farm_id: formData.farm_id || undefined,
      plot_id: formData.plot_id || undefined,
      serial_number: formData.serial_number.trim() || undefined,
      mac_address: formData.mac_address.trim() || undefined,
      firmware_version: formData.firmware_version.trim() || undefined,
      location: formData.location_description.trim() 
        ? { description: formData.location_description.trim() }
        : undefined,
    };

    setIsSaving(true);
    try {
      await adminService.updateSensor(selectedSensor.id, payload);
      toast.success('Sensor atualizado com sucesso');
      setIsEditOpen(false);
      resetForm();
      setSelectedSensor(null);
      loadSensors();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSensor) return;

    setIsSaving(true);
    try {
      await adminService.deleteSensor(selectedSensor.id);
      toast.success('Sensor removido com sucesso');
      setIsDeleteOpen(false);
      setSelectedSensor(null);
      loadSensors();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    if (selectedFarmId) {
      setFormData(prev => ({ ...prev, farm_id: selectedFarmId }));
      loadPlots(selectedFarmId);
    }
    setIsCreateOpen(true);
  };

  const openEditDialog = async (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setFormData({
      name: sensor.name,
      sensor_type_id: sensor.sensor_type_id,
      farm_id: sensor.farm_id || '',
      plot_id: sensor.plot_id || '',
      serial_number: sensor.serial_number || '',
      mac_address: sensor.mac_address || '',
      firmware_version: sensor.firmware_version || '',
      location_description: sensor.location?.description || '',
    });
    if (sensor.farm_id) {
      await loadPlots(sensor.farm_id);
    }
    setIsEditOpen(true);
  };

  const openDeleteDialog = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setIsDeleteOpen(true);
  };

  const handleFarmChange = (farmId: string) => {
    setFormData({ ...formData, farm_id: farmId, plot_id: '' });
  };

  // Stats
  const stats = useMemo(() => ({
    total: sensors.length,
    online: sensors.filter(s => s.is_online).length,
    offline: sensors.filter(s => !s.is_online).length,
    lowBattery: sensors.filter(s => s.battery_level !== null && s.battery_level < 30).length,
  }), [sensors]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sensores</h1>
          <p className="text-muted-foreground">
            Gerencie os sensores das organizações
          </p>
        </div>
        <Button 
          onClick={openCreateDialog} 
          disabled={!selectedOrgId}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Sensor
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Organização *</Label>
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma organização" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fazenda</Label>
              <Select 
                value={selectedFarmId || '__all__'} 
                onValueChange={(v) => setSelectedFarmId(v === '__all__' ? '' : v)}
                disabled={!selectedOrgId || isLoadingFarms}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingFarms ? "Carregando..." : "Todas as fazendas"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas as fazendas</SelectItem>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, serial, MAC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  disabled={!selectedOrgId}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {selectedOrgId && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Wifi className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.online}</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <WifiOff className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.offline}</p>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Battery className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.lowBattery}</p>
                  <p className="text-xs text-muted-foreground">Bateria Baixa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      {!selectedOrgId ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Selecione uma organização para visualizar os sensores
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
                <TableHead>Tipo</TableHead>
                <TableHead>Fazenda</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bateria</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingSensors ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSensors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Cpu className="w-8 h-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchQuery ? 'Nenhum sensor encontrado' : 'Nenhum sensor cadastrado'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSensors.map((sensor) => (
                  <TableRow key={sensor.id}>
                    <TableCell className="font-medium">{sensor.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getSensorTypeName(sensor.sensor_type_id)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getFarmName(sensor.farm_id)}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {sensor.serial_number || '-'}
                      </code>
                    </TableCell>
                    <TableCell>
                      {sensor.is_online ? (
                        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                          <Wifi className="w-3 h-3 mr-1" />
                          Online
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <WifiOff className="w-3 h-3 mr-1" />
                          Offline
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {sensor.battery_level !== null ? (
                        <div className="flex items-center gap-1">
                          <Battery className={`w-4 h-4 ${
                            sensor.battery_level < 30 ? 'text-red-500' :
                            sensor.battery_level < 60 ? 'text-yellow-500' :
                            'text-green-500'
                          }`} />
                          <span className="text-sm">{sensor.battery_level}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
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
                          <DropdownMenuItem onClick={() => openEditDialog(sensor)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(sensor)}
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Novo Sensor</DialogTitle>
            <DialogDescription>
              Cadastre um novo sensor para a organização
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Sensor Solo T01"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sensor_type">Tipo de Sensor *</Label>
              <Select 
                value={formData.sensor_type_id} 
                onValueChange={(v) => setFormData({ ...formData, sensor_type_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {sensorTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="farm">Fazenda *</Label>
                <Select 
                  value={formData.farm_id} 
                  onValueChange={handleFarmChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
              <div className="grid gap-2">
                <Label htmlFor="plot">Talhão</Label>
                <Select 
                  value={formData.plot_id || '__none__'} 
                  onValueChange={(v) => setFormData({ ...formData, plot_id: v === '__none__' ? '' : v })}
                  disabled={!formData.farm_id || isLoadingPlots}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingPlots ? "Carregando..." : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {plots.map((plot) => (
                      <SelectItem key={plot.id} value={plot.id}>
                        {plot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="serial">Número de Série</Label>
                <Input
                  id="serial"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  placeholder="Ex: SN-123456"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mac">Endereço MAC</Label>
                <Input
                  id="mac"
                  value={formData.mac_address}
                  onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                  placeholder="Ex: AA:BB:CC:DD:EE:FF"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="firmware">Versão do Firmware</Label>
              <Input
                id="firmware"
                value={formData.firmware_version}
                onChange={(e) => setFormData({ ...formData, firmware_version: e.target.value })}
                placeholder="Ex: v1.2.3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Localização (descrição)</Label>
              <Input
                id="location"
                value={formData.location_description}
                onChange={(e) => setFormData({ ...formData, location_description: e.target.value })}
                placeholder="Ex: Entrada do talhão, próximo ao reservatório"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? 'Criando...' : 'Criar Sensor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Editar Sensor</DialogTitle>
            <DialogDescription>
              Atualize os dados do sensor
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Sensor Solo T01"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sensor_type">Tipo de Sensor *</Label>
              <Select 
                value={formData.sensor_type_id} 
                onValueChange={(v) => setFormData({ ...formData, sensor_type_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {sensorTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-farm">Fazenda *</Label>
                <Select 
                  value={formData.farm_id} 
                  onValueChange={handleFarmChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
              <div className="grid gap-2">
                <Label htmlFor="edit-plot">Talhão</Label>
                <Select 
                  value={formData.plot_id || '__none__'} 
                  onValueChange={(v) => setFormData({ ...formData, plot_id: v === '__none__' ? '' : v })}
                  disabled={!formData.farm_id || isLoadingPlots}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingPlots ? "Carregando..." : "Selecione"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {plots.map((plot) => (
                      <SelectItem key={plot.id} value={plot.id}>
                        {plot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-serial">Número de Série</Label>
                <Input
                  id="edit-serial"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  placeholder="Ex: SN-123456"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-mac">Endereço MAC</Label>
                <Input
                  id="edit-mac"
                  value={formData.mac_address}
                  onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                  placeholder="Ex: AA:BB:CC:DD:EE:FF"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-firmware">Versão do Firmware</Label>
              <Input
                id="edit-firmware"
                value={formData.firmware_version}
                onChange={(e) => setFormData({ ...formData, firmware_version: e.target.value })}
                placeholder="Ex: v1.2.3"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Localização (descrição)</Label>
              <Input
                id="edit-location"
                value={formData.location_description}
                onChange={(e) => setFormData({ ...formData, location_description: e.target.value })}
                placeholder="Ex: Entrada do talhão, próximo ao reservatório"
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
              Tem certeza que deseja excluir o sensor "{selectedSensor?.name}"?
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
