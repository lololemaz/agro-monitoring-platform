import { useState } from 'react';
import { UserPlus, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { adminService } from '@/services/adminService';
import { getErrorMessage } from '@/services/api';

export default function Superusers() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = (): string | null => {
    if (!email.trim()) {
      return 'E-mail é obrigatório';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'E-mail inválido';
    }
    if (!password) {
      return 'Senha é obrigatória';
    }
    if (password.length < 8) {
      return 'A senha deve ter pelo menos 8 caracteres';
    }
    if (password !== confirmPassword) {
      return 'As senhas não coincidem';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setIsLoading(true);
    setSuccess(false);

    try {
      await adminService.createSuperuser(email.trim(), password);
      toast.success('Superusuário criado com sucesso');
      setSuccess(true);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Superusuários</h1>
        <p className="text-muted-foreground">
          Crie novos administradores do sistema
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Criar Superusuário
            </CardTitle>
            <CardDescription>
              Superusuários têm acesso total ao sistema, incluindo criação de organizações
              e gerenciamento de tipos de sensores globais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@empresa.com"
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    disabled={isLoading}
                    autoComplete="new-password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Criando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Criar Superusuário
                  </span>
                )}
              </Button>

              {success && (
                <Alert className="bg-green-500/10 border-green-500/20">
                  <AlertDescription className="text-green-500">
                    Superusuário criado com sucesso! O novo administrador já pode fazer login.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Sobre Superusuários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Acesso Total</p>
                  <p className="text-sm text-muted-foreground">
                    Superusuários podem acessar todas as funcionalidades do sistema,
                    incluindo dados de todas as organizações.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Gerenciamento de Organizações</p>
                  <p className="text-sm text-muted-foreground">
                    Podem criar, editar e desativar organizações, bem como
                    definir suas configurações iniciais.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Tipos de Sensor Globais</p>
                  <p className="text-sm text-muted-foreground">
                    Gerenciam o catálogo global de tipos de sensores disponíveis
                    para todas as organizações.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">4</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Criação de Administradores</p>
                  <p className="text-sm text-muted-foreground">
                    Podem criar novos superusuários para ajudar na administração
                    do sistema.
                  </p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Importante:</strong> Use superusuários apenas para funções
                administrativas do sistema. Para acesso a organizações específicas,
                crie usuários normais com os roles apropriados.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
