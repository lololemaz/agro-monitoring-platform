import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { usersService } from '@/services/usersService';
import { getErrorMessage } from '@/services/api';
import type { UserUpdate } from '@/types/auth';

export default function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user) return;

    const payload: UserUpdate = {
      first_name: profileForm.first_name.trim() || undefined,
      last_name: profileForm.last_name.trim() || undefined,
      phone: profileForm.phone.trim() || undefined,
    };

    setIsSavingProfile(true);
    try {
      await usersService.updateUser(user.id, payload);
      toast.success('Perfil atualizado com sucesso');
      if (refreshUser) {
        await refreshUser();
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password) {
      toast.error('Senha atual é obrigatória');
      return;
    }
    if (!passwordForm.new_password) {
      toast.error('Nova senha é obrigatória');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Nova senha deve ter no mínimo 8 caracteres');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('As senhas não conferem');
      return;
    }

    setIsSavingPassword(true);
    try {
      await authService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Senha alterada com sucesso');
      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Meu Perfil</h2>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e senha
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Informações Pessoais</CardTitle>
          </div>
          <CardDescription>
            Atualize seu nome e informações de contato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O e-mail não pode ser alterado
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input
                id="first_name"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                placeholder="Seu nome"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_name">Sobrenome</Label>
              <Input
                id="last_name"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                placeholder="Seu sobrenome"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          <Button onClick={handleUpdateProfile} disabled={isSavingProfile}>
            <Save className="w-4 h-4 mr-2" />
            {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Alterar Senha</CardTitle>
          </div>
          <CardDescription>
            Atualize sua senha de acesso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="current_password">Senha Atual *</Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                placeholder="Digite sua senha atual"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label htmlFor="new_password">Nova Senha *</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirm_password">Confirmar Nova Senha *</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                placeholder="Repita a nova senha"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button onClick={handleChangePassword} disabled={isSavingPassword}>
            <KeyRound className="w-4 h-4 mr-2" />
            {isSavingPassword ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
