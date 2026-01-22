import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Building2, MoreHorizontal, Search, Eye, EyeOff, UserPlus, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
import { adminService } from '@/services/adminService';
import { getErrorMessage } from '@/services/api';
import type { Organization, OrganizationCreate, OrganizationUpdate } from '@/types/organization';

// ==========================================
// Validation & Formatting Utilities
// ==========================================

/**
 * Remove all non-numeric characters
 */
const onlyNumbers = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Format CNPJ: 00.000.000/0000-00
 */
const formatCNPJ = (value: string): string => {
  const numbers = onlyNumbers(value);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
};

/**
 * Format phone: (00) 00000-0000 or (00) 0000-0000
 */
const formatPhone = (value: string): string => {
  const numbers = onlyNumbers(value);
  if (numbers.length <= 2) return numbers.length ? `(${numbers}` : '';
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

/**
 * Validate CNPJ (basic check - 14 digits)
 */
const isValidCNPJ = (value: string): boolean => {
  const numbers = onlyNumbers(value);
  if (numbers.length === 0) return true; // Empty is valid (optional field)
  return numbers.length === 14;
};

/**
 * Validate phone (10 or 11 digits)
 */
const isValidPhone = (value: string): boolean => {
  const numbers = onlyNumbers(value);
  if (numbers.length === 0) return true; // Empty is valid (optional field)
  return numbers.length === 10 || numbers.length === 11;
};

// ==========================================
// Form Types
// ==========================================

interface CreateFormData {
  name: string;
  company_name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  owner_email: string;
  owner_password: string;
  owner_first_name: string;
  owner_last_name: string;
}

interface EditFormData {
  name: string;
  company_name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  owner_email: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_password: string;
  resetPassword: boolean;
}

const initialCreateForm: CreateFormData = {
  name: '',
  company_name: '',
  document: '',
  email: '',
  phone: '',
  address: '',
  owner_email: '',
  owner_password: '',
  owner_first_name: '',
  owner_last_name: '',
};

const initialEditForm: EditFormData = {
  name: '',
  company_name: '',
  document: '',
  email: '',
  phone: '',
  address: '',
  owner_email: '',
  owner_first_name: '',
  owner_last_name: '',
  owner_password: '',
  resetPassword: false,
};

// ==========================================
// Component
// ==========================================

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState<CreateFormData>(initialCreateForm);
  const [editForm, setEditForm] = useState<EditFormData>(initialEditForm);

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredOrgs(
        organizations.filter(
          org =>
            org.name.toLowerCase().includes(query) ||
            org.company_name?.toLowerCase().includes(query) ||
            org.email?.toLowerCase().includes(query) ||
            org.document?.includes(query)
        )
      );
    } else {
      setFilteredOrgs(organizations);
    }
  }, [searchQuery, organizations]);

  const loadOrganizations = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getOrganizations();
      setOrganizations(data);
      setFilteredOrgs(data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm(initialCreateForm);
    setShowPassword(false);
  };

  const resetEditForm = () => {
    setEditForm(initialEditForm);
    setShowPassword(false);
  };

  // ==========================================
  // Create Form Handlers
  // ==========================================

  const handleCreateDocumentChange = (value: string) => {
    const formatted = formatCNPJ(value);
    if (onlyNumbers(formatted).length <= 14) {
      setCreateForm({ ...createForm, document: formatted });
    }
  };

  const handleCreatePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    if (onlyNumbers(formatted).length <= 11) {
      setCreateForm({ ...createForm, phone: formatted });
    }
  };

  const validateCreateForm = (): string | null => {
    if (!createForm.name.trim()) {
      return 'Nome da organização é obrigatório';
    }
    if (createForm.document && !isValidCNPJ(createForm.document)) {
      return 'CNPJ deve ter 14 dígitos';
    }
    if (createForm.phone && !isValidPhone(createForm.phone)) {
      return 'Telefone deve ter 10 ou 11 dígitos';
    }
    if (!createForm.owner_email.trim()) {
      return 'E-mail do proprietário é obrigatório';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.owner_email)) {
      return 'E-mail do proprietário inválido';
    }
    if (!createForm.owner_password) {
      return 'Senha do proprietário é obrigatória';
    }
    if (createForm.owner_password.length < 8) {
      return 'A senha deve ter pelo menos 8 caracteres';
    }
    return null;
  };

  const handleCreate = async () => {
    const error = validateCreateForm();
    if (error) {
      toast.error(error);
      return;
    }

    const payload: OrganizationCreate = {
      name: createForm.name.trim(),
      company_name: createForm.company_name.trim() || undefined,
      document: onlyNumbers(createForm.document) || undefined,
      email: createForm.email.trim() || undefined,
      phone: onlyNumbers(createForm.phone) || undefined,
      address: createForm.address.trim() || undefined,
      owner_email: createForm.owner_email.trim(),
      owner_password: createForm.owner_password,
      owner_first_name: createForm.owner_first_name.trim() || undefined,
      owner_last_name: createForm.owner_last_name.trim() || undefined,
    };

    setIsSaving(true);
    try {
      await adminService.createOrganization(payload);
      toast.success('Organização criada com sucesso');
      setIsCreateOpen(false);
      resetCreateForm();
      loadOrganizations();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // Edit Form Handlers
  // ==========================================

  const handleEditDocumentChange = (value: string) => {
    const formatted = formatCNPJ(value);
    if (onlyNumbers(formatted).length <= 14) {
      setEditForm({ ...editForm, document: formatted });
    }
  };

  const handleEditPhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    if (onlyNumbers(formatted).length <= 11) {
      setEditForm({ ...editForm, phone: formatted });
    }
  };

  const validateEditForm = (): string | null => {
    if (!editForm.name.trim()) {
      return 'Nome é obrigatório';
    }
    if (editForm.document && !isValidCNPJ(editForm.document)) {
      return 'CNPJ deve ter 14 dígitos';
    }
    if (editForm.phone && !isValidPhone(editForm.phone)) {
      return 'Telefone deve ter 10 ou 11 dígitos';
    }
    if (!editForm.owner_email.trim()) {
      return 'E-mail do proprietário é obrigatório';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.owner_email)) {
      return 'E-mail do proprietário inválido';
    }
    if (editForm.resetPassword && editForm.owner_password.length < 8) {
      return 'A nova senha deve ter pelo menos 8 caracteres';
    }
    return null;
  };

  const handleEdit = async () => {
    if (!selectedOrg) return;

    const error = validateEditForm();
    if (error) {
      toast.error(error);
      return;
    }

    const payload: OrganizationUpdate = {
      name: editForm.name.trim(),
      company_name: editForm.company_name.trim() || undefined,
      document: onlyNumbers(editForm.document) || undefined,
      email: editForm.email.trim() || undefined,
      phone: onlyNumbers(editForm.phone) || undefined,
      address: editForm.address.trim() || undefined,
      owner_email: editForm.owner_email.trim() || undefined,
      owner_first_name: editForm.owner_first_name.trim() || undefined,
      owner_last_name: editForm.owner_last_name.trim() || undefined,
    };

    setIsSaving(true);
    try {
      // Update organization data
      const updatedOrg = await adminService.updateOrganization(selectedOrg.id, payload);
      
      // If resetting password, use the dedicated endpoint
      if (editForm.resetPassword && editForm.owner_password && updatedOrg.owner_id) {
        await adminService.resetUserPassword(updatedOrg.owner_id, editForm.owner_password);
        const loginEmail = updatedOrg.owner_email || editForm.owner_email.trim();
        toast.success(
          `Senha do proprietário atualizada com sucesso. Use o email "${loginEmail}" para fazer login.`,
          { duration: 5000 }
        );
      } else {
        const emailChanged = editForm.owner_email.trim() !== (selectedOrg.owner_email || '');
        if (emailChanged) {
          toast.success(
            `Organização atualizada com sucesso. O email de login do proprietário foi alterado para "${editForm.owner_email.trim()}".`,
            { duration: 5000 }
          );
        } else {
          toast.success('Organização atualizada com sucesso');
        }
      }
      setIsEditOpen(false);
      resetEditForm();
      setSelectedOrg(null);
      loadOrganizations();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;

    setIsSaving(true);
    try {
      await adminService.deleteOrganization(selectedOrg.id);
      toast.success('Organização removida com sucesso');
      setIsDeleteOpen(false);
      setSelectedOrg(null);
      loadOrganizations();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (org: Organization) => {
    setSelectedOrg(org);
    setEditForm({
      name: org.name,
      company_name: org.company_name || '',
      document: org.document ? formatCNPJ(org.document) : '',
      email: org.email || '',
      phone: org.phone ? formatPhone(org.phone) : '',
      address: org.address || '',
      owner_email: org.owner_email || '',
      owner_first_name: org.owner_first_name || '',
      owner_last_name: org.owner_last_name || '',
      owner_password: '',
      resetPassword: false,
    });
    setShowPassword(false);
    setIsEditOpen(true);
  };

  const openDeleteDialog = (org: Organization) => {
    setSelectedOrg(org);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizações</h1>
          <p className="text-muted-foreground">
            Gerencie as organizações do sistema
          </p>
        </div>
        <Button onClick={() => { resetCreateForm(); setIsCreateOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Organização
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, empresa, e-mail ou CNPJ..."
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
              <TableHead>Empresa</TableHead>
              <TableHead>E-mail Org.</TableHead>
              <TableHead>E-mail Owner (Login)</TableHead>
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
            ) : filteredOrgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Nenhuma organização encontrada' : 'Nenhuma organização cadastrada'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>{org.company_name || '-'}</TableCell>
                  <TableCell>{org.email || '-'}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{org.owner_email || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.is_active ? 'default' : 'secondary'}>
                      {org.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(org)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(org)}
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
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Organização</DialogTitle>
            <DialogDescription>
              Preencha os dados da organização e do usuário proprietário (owner)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Organization Section */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Dados da Organização</span>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Organização *</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Nome da organização"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company_name">Razão Social</Label>
              <Input
                id="company_name"
                value={createForm.company_name}
                onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
                placeholder="Razão social"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="document">CNPJ</Label>
                <Input
                  id="document"
                  value={createForm.document}
                  onChange={(e) => handleCreateDocumentChange(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={createForm.phone}
                  onChange={(e) => handleCreatePhoneChange(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail da Organização</Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="contato@empresa.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={createForm.address}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>

            <Separator className="my-2" />

            {/* Owner Section */}
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Usuário Proprietário (Owner)</span>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              Este usuário terá acesso total à organização. O email do proprietário será usado para fazer login no sistema.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="owner_first_name">Nome</Label>
                <Input
                  id="owner_first_name"
                  value={createForm.owner_first_name}
                  onChange={(e) => setCreateForm({ ...createForm, owner_first_name: e.target.value })}
                  placeholder="Nome"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="owner_last_name">Sobrenome</Label>
                <Input
                  id="owner_last_name"
                  value={createForm.owner_last_name}
                  onChange={(e) => setCreateForm({ ...createForm, owner_last_name: e.target.value })}
                  placeholder="Sobrenome"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner_email">E-mail do Proprietário *</Label>
              <Input
                id="owner_email"
                type="email"
                value={createForm.owner_email}
                onChange={(e) => setCreateForm({ ...createForm, owner_email: e.target.value })}
                placeholder="proprietario@empresa.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner_password">Senha *</Label>
              <div className="relative">
                <Input
                  id="owner_password"
                  type={showPassword ? 'text' : 'password'}
                  value={createForm.owner_password}
                  onChange={(e) => setCreateForm({ ...createForm, owner_password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? 'Criando...' : 'Criar Organização'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Organização</DialogTitle>
            <DialogDescription>
              Atualize os dados da organização e do proprietário
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Organization Section */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Dados da Organização</span>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nome da organização"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-company_name">Razão Social</Label>
              <Input
                id="edit-company_name"
                value={editForm.company_name}
                onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                placeholder="Razão social"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-document">CNPJ</Label>
                <Input
                  id="edit-document"
                  value={editForm.document}
                  onChange={(e) => handleEditDocumentChange(e.target.value)}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => handleEditPhoneChange(e.target.value)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="contato@empresa.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Endereço</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Endereço completo"
              />
            </div>

            <Separator className="my-2" />

            {/* Owner Section */}
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Proprietário da Organização</span>
            </div>
            
            {/* Email do Owner - usado para login */}
            <div className="grid gap-2">
              <Label htmlFor="edit-owner_email">E-mail do Proprietário (Login) *</Label>
              <Input
                id="edit-owner_email"
                type="email"
                value={editForm.owner_email}
                onChange={(e) => setEditForm({ ...editForm, owner_email: e.target.value })}
                placeholder="proprietario@empresa.com"
              />
              <p className="text-xs text-muted-foreground">
                ⚠️ Este é o email usado para fazer login no sistema. Não confunda com o email da organização.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-owner_first_name">Nome</Label>
                <Input
                  id="edit-owner_first_name"
                  value={editForm.owner_first_name}
                  onChange={(e) => setEditForm({ ...editForm, owner_first_name: e.target.value })}
                  placeholder="Nome"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-owner_last_name">Sobrenome</Label>
                <Input
                  id="edit-owner_last_name"
                  value={editForm.owner_last_name}
                  onChange={(e) => setEditForm({ ...editForm, owner_last_name: e.target.value })}
                  placeholder="Sobrenome"
                />
              </div>
            </div>

            {/* Password Reset Section */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="reset-password" className="font-medium">
                    Resetar Senha
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ative para definir uma nova senha para o proprietário
                </p>
              </div>
              <Switch
                id="reset-password"
                checked={editForm.resetPassword}
                onCheckedChange={(checked) => {
                  setEditForm({ 
                    ...editForm, 
                    resetPassword: checked,
                    owner_password: checked ? editForm.owner_password : ''
                  });
                  if (!checked) setShowPassword(false);
                }}
              />
            </div>

            {editForm.resetPassword && (
              <div className="grid gap-2">
                <Label htmlFor="edit-owner_password">Nova Senha *</Label>
                <div className="relative">
                  <Input
                    id="edit-owner_password"
                    type={showPassword ? 'text' : 'password'}
                    value={editForm.owner_password}
                    onChange={(e) => setEditForm({ ...editForm, owner_password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
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
              Tem certeza que deseja excluir a organização "{selectedOrg?.name}"?
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
