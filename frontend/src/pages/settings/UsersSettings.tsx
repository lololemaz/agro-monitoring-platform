import { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Users, 
  MoreHorizontal, 
  Search,
  KeyRound,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DropdownMenuSeparator,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usersService } from '@/services/usersService';
import { getErrorMessage } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { User, Role, UserCreate, UserUpdate, USER_ROLE_LABELS } from '@/types/auth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CreateFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  role_id: string;
}

interface EditFormData {
  first_name: string;
  last_name: string;
  phone: string;
  role_id: string;
  is_active: boolean;
}

const initialCreateForm: CreateFormData = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone: '',
  role_id: '',
};

const initialEditForm: EditFormData = {
  first_name: '',
  last_name: '',
  phone: '',
  role_id: '',
  is_active: true,
};

// Role labels
const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietário',
  manager: 'Gerente',
  agronomist: 'Agrônomo',
  operator: 'Operador',
  viewer: 'Visualizador',
};

const getRoleLabel = (role?: Role | string, isOrgOwner?: boolean): string => {
  if (isOrgOwner) return 'Proprietário';
  if (!role) return 'Sem cargo';
  if (typeof role === 'string') return ROLE_LABELS[role] || role;
  return ROLE_LABELS[role.slug] || role.name;
};

const getRoleColor = (slug?: string, isOrgOwner?: boolean): string => {
  if (isOrgOwner) return 'bg-purple-500/10 text-purple-500';
  switch (slug) {
    case 'owner': return 'bg-purple-500/10 text-purple-500';
    case 'manager': return 'bg-blue-500/10 text-blue-500';
    case 'agronomist': return 'bg-green-500/10 text-green-500';
    case 'operator': return 'bg-yellow-500/10 text-yellow-600';
    case 'viewer': return 'bg-gray-500/10 text-gray-500';
    default: return 'bg-muted text-muted-foreground';
  }
};

/**
 * Format phone: (00) 00000-0000 or (00) 0000-0000
 */
const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers.length ? `(${numbers}` : '';
  if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

/**
 * Validate phone (10 or 11 digits)
 */
const isValidPhone = (value: string): boolean => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length === 0) return true; // Empty is valid (optional field)
  return numbers.length === 10 || numbers.length === 11;
};

export default function UsersSettings() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states
  const [createForm, setCreateForm] = useState<CreateFormData>(initialCreateForm);
  const [editForm, setEditForm] = useState<EditFormData>(initialEditForm);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        usersService.getUsers(),
        usersService.getRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData); // Show all roles (system roles are the assignable ones)
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(u => 
      u.email.toLowerCase().includes(query) ||
      u.first_name?.toLowerCase().includes(query) ||
      u.last_name?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const getUserInitials = (user: User): string => {
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  };

  const getUserRole = (user: User): Role | undefined => {
    return user.roles?.[0];
  };

  const validateCreateForm = (): string | null => {
    if (!createForm.email.trim()) return 'Email é obrigatório';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) return 'Email inválido';
    if (!createForm.password) return 'Senha é obrigatória';
    if (createForm.password.length < 8) return 'Senha deve ter no mínimo 8 caracteres';
    if (!createForm.first_name.trim()) return 'Nome é obrigatório';
    if (!createForm.last_name.trim()) return 'Sobrenome é obrigatório';
    if (createForm.phone && !isValidPhone(createForm.phone)) return 'Telefone deve ter 10 ou 11 dígitos';
    return null;
  };

  const handlePhoneChange = (value: string, isEdit: boolean = false) => {
    const formatted = formatPhone(value);
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      if (isEdit) {
        setEditForm({ ...editForm, phone: formatted });
      } else {
        setCreateForm({ ...createForm, phone: formatted });
      }
    }
  };

  const validateEditForm = (): string | null => {
    if (!editForm.first_name.trim()) return 'Nome é obrigatório';
    if (!editForm.last_name.trim()) return 'Sobrenome é obrigatório';
    if (editForm.phone && !isValidPhone(editForm.phone)) return 'Telefone deve ter 10 ou 11 dígitos';
    return null;
  };

  const handleCreate = async () => {
    const error = validateCreateForm();
    if (error) {
      toast.error(error);
      return;
    }

    const payload: UserCreate = {
      email: createForm.email.trim().toLowerCase(),
      password: createForm.password,
      first_name: createForm.first_name.trim(),
      last_name: createForm.last_name.trim(),
      phone: createForm.phone ? createForm.phone.replace(/\D/g, '') : undefined,
      role_id: createForm.role_id || undefined,
    };

    setIsSaving(true);
    try {
      await usersService.createUser(payload);
      toast.success('Usuário criado com sucesso');
      setIsCreateOpen(false);
      setCreateForm(initialCreateForm);
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    
    const error = validateEditForm();
    if (error) {
      toast.error(error);
      return;
    }

    const payload: UserUpdate = {
      first_name: editForm.first_name.trim(),
      last_name: editForm.last_name.trim(),
      phone: editForm.phone ? editForm.phone.replace(/\D/g, '') : undefined,
      is_active: editForm.is_active,
      role_id: selectedUser?.is_org_owner ? undefined : (editForm.role_id || undefined),
    };

    setIsSaving(true);
    try {
      await usersService.updateUser(selectedUser.id, payload);
      toast.success('Usuário atualizado com sucesso');
      setIsEditOpen(false);
      setSelectedUser(null);
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setIsSaving(true);
    try {
      await usersService.deleteUser(selectedUser.id);
      toast.success('Usuário removido com sucesso');
      setIsDeleteOpen(false);
      setSelectedUser(null);
      loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    if (!newPassword) {
      toast.error('Nova senha é obrigatória');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Senha deve ter no mínimo 8 caracteres');
      return;
    }

    setIsSaving(true);
    try {
      await usersService.resetUserPassword(selectedUser.id, newPassword);
      toast.success('Senha redefinida com sucesso');
      setIsResetPasswordOpen(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateDialog = () => {
    setCreateForm(initialCreateForm);
    setIsCreateOpen(true);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    const userRole = getUserRole(user);
    setEditForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone ? formatPhone(user.phone) : '',
      role_id: userRole?.id || '',
      is_active: user.is_active,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const openResetPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setIsResetPasswordOpen(true);
  };

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
  }), [users]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Equipe</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os usuários da sua organização
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <UserCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <UserX className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Inativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários..."
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
              <TableHead>Usuário</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Acesso</TableHead>
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
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const role = getUserRole(user);
                const isCurrentUser = user.id === currentUser?.id;
                const isOwner = user.is_org_owner;
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getRoleColor(role?.slug, isOwner)}>
                        <Shield className="w-3 h-3 mr-1" />
                        {getRoleLabel(role, isOwner)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.is_active ? (
                        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.last_login_at 
                        ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true, locale: ptBR })
                        : 'Nunca acessou'
                      }
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isCurrentUser}>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                            <KeyRound className="w-4 h-4 mr-2" />
                            Resetar Senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(user)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Adicione um novo membro à equipe
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="usuario@empresa.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first_name">Nome *</Label>
                <Input
                  id="first_name"
                  value={createForm.first_name}
                  onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                  placeholder="Nome"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Sobrenome *</Label>
                <Input
                  id="last_name"
                  value={createForm.last_name}
                  onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                  placeholder="Sobrenome"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={createForm.phone}
                  onChange={(e) => handlePhoneChange(e.target.value, false)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label>Cargo</Label>
                <Select 
                  value={createForm.role_id || '__none__'} 
                  onValueChange={(v) => setCreateForm({ ...createForm, role_id: v === '__none__' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {getRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize os dados do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={selectedUser?.email || ''} disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-first_name">Nome *</Label>
                <Input
                  id="edit-first_name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  placeholder="Nome"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-last_name">Sobrenome *</Label>
                <Input
                  id="edit-last_name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                  placeholder="Sobrenome"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => handlePhoneChange(e.target.value, true)}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label>Cargo</Label>
                <Select 
                  value={editForm.role_id || '__none__'} 
                  onValueChange={(v) => setEditForm({ ...editForm, role_id: v === '__none__' ? '' : v })}
                  disabled={selectedUser?.is_org_owner}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {getRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedUser?.is_org_owner && (
                  <p className="text-xs text-muted-foreground">
                    Proprietário não pode ter o cargo alterado
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Status</Label>
                <p className="text-xs text-muted-foreground">
                  Usuários inativos não podem acessar o sistema
                </p>
              </div>
              <Switch
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
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

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-password">Nova Senha *</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={isSaving}>
              {isSaving ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o usuário "{selectedUser?.first_name} {selectedUser?.last_name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
