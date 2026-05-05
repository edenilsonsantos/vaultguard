import { useGetSettings, useUpdateSetting, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Settings2, Info, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SESSION_TIMEOUT_OPTIONS = [
  { value: "0",    label: "Nunca (sem limite)" },
  { value: "5",    label: "5 minutos" },
  { value: "10",   label: "10 minutos" },
  { value: "15",   label: "15 minutos" },
  { value: "30",   label: "30 minutos" },
  { value: "60",   label: "1 hora" },
  { value: "120",  label: "2 horas" },
  { value: "240",  label: "4 horas" },
  { value: "480",  label: "8 horas" },
  { value: "1440", label: "24 horas" },
];

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const updateSettingMutation = useUpdateSetting();

  const showDemo = settings?.find((s) => s.key === "show_demo_credentials")?.value !== "false";
  const sessionTimeout = settings?.find((s) => s.key === "session_timeout_minutes")?.value ?? "0";

  function handleToggleDemoCredentials(checked: boolean) {
    updateSettingMutation.mutate(
      { key: "show_demo_credentials", data: { value: checked ? "true" : "false" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast({
            title: checked ? "Credenciais de demonstração ativadas" : "Credenciais de demonstração desativadas",
            description: checked
              ? "Os cartões de demo voltarão a aparecer na tela de login."
              : "Os cartões de demo foram ocultados da tela de login.",
          });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar a configuração." });
        },
      }
    );
  }

  function handleSessionTimeoutChange(value: string) {
    updateSettingMutation.mutate(
      { key: "session_timeout_minutes", data: { value } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          const option = SESSION_TIMEOUT_OPTIONS.find((o) => o.value === value);
          toast({
            title: "Tempo de sessão atualizado",
            description:
              value === "0"
                ? "Sessões não expirarão automaticamente."
                : `Usuários serão desconectados após ${option?.label}.`,
          });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar a configuração." });
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Preferências globais do sistema VaultGuard.</p>
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <CardTitle>Tela de login</CardTitle>
          </div>
          <CardDescription>Controle o que aparece na tela de autenticação pública.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
          ) : (
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1 flex-1">
                <Label htmlFor="show-demo" className="text-sm font-medium">
                  Exibir credenciais de demonstração
                </Label>
                <p className="text-xs text-muted-foreground">
                  Quando ativado, os cartões com as contas <code className="font-mono">demo_admin</code> e{" "}
                  <code className="font-mono">demo_user</code> são exibidos na tela de login para facilitar
                  o acesso em ambientes de demonstração.
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-500/80">
                  <Info className="w-3.5 h-3.5" />
                  <span>Desative em produção para não expor credenciais de teste.</span>
                </div>
              </div>
              <Switch
                id="show-demo"
                checked={showDemo}
                onCheckedChange={handleToggleDemoCredentials}
                disabled={updateSettingMutation.isPending}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle>Sessão do usuário</CardTitle>
          </div>
          <CardDescription>Controle por quanto tempo um usuário permanece autenticado no navegador.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-80" />
              <Skeleton className="h-9 w-48" />
            </div>
          ) : (
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1 flex-1">
                <Label className="text-sm font-medium">
                  Tempo máximo de sessão
                </Label>
                <p className="text-xs text-muted-foreground">
                  Após o período selecionado desde o login, o usuário é desconectado automaticamente do
                  navegador, independentemente de atividade. Defina como <strong>Nunca</strong> para
                  sessões sem expiração (limitadas apenas pelo JWT de 24 h).
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-500/80">
                  <Info className="w-3.5 h-3.5" />
                  <span>A alteração entra em vigor imediatamente para todas as sessões ativas.</span>
                </div>
              </div>
              <Select
                value={sessionTimeout}
                onValueChange={handleSessionTimeoutChange}
                disabled={updateSettingMutation.isPending}
              >
                <SelectTrigger className="w-48 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TIMEOUT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
