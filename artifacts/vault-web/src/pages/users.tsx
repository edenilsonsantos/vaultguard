import { useState } from "react";
import {
  useListUsers,
  useUpdateUser,
  useDeleteUser,
  useResetUserPassword,
  useToggleUserActive,
  getListUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Shield, ShieldAlert, Trash2, KeyRound, RotateCcw, FlaskConical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

const DEMO_USERNAMES = ["demo_user", "demo_admin"];

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useListUsers();

  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const resetPasswordMutation = useResetUserPassword();
  const toggleActiveMutation = useToggleUserActive();

  const [search, setSearch] = useState("");
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  const [userToReset, setUserToReset] = useState<{ id: number; name: string } | null>(null);

  const filteredUsers = users?.filter(
    (user) =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
  }

  const handleRoleChange = (id: number, newRole: string) => {
    updateUserMutation.mutate(
      { id, data: { role: newRole } },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Perfil atualizado", description: "As permissões do usuário foram modificadas." });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Falha na atualização", description: "Não foi possível alterar o perfil." });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!userToDelete) return;
    deleteUserMutation.mutate(
      { id: userToDelete.id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Usuário removido", description: "Identidade excluída do sistema." });
          setUserToDelete(null);
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Falha na exclusão", description: (err.data as any)?.error || "Não foi possível remover o usuário." });
          setUserToDelete(null);
        },
      }
    );
  };

  const handleResetPassword = () => {
    if (!userToReset) return;
    resetPasswordMutation.mutate(
      { id: userToReset.id },
      {
        onSuccess: (res) => {
          invalidate();
          toast({ title: "Senha redefinida", description: res.message });
          setUserToReset(null);
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Falha", description: (err.data as any)?.error || "Não foi possível redefinir a senha." });
          setUserToReset(null);
        },
      }
    );
  };

  const handleToggleActive = (id: number, currentActive: boolean, name: string) => {
    toggleActiveMutation.mutate(
      { id },
      {
        onSuccess: (user) => {
          invalidate();
          toast({
            title: user.isActive ? "Usuário ativado" : "Usuário desativado",
            description: `@${name} foi ${user.isActive ? "ativado" : "desativado"} com sucesso.`,
          });
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Operação bloqueada",
            description: (err.data as any)?.error || "Não foi possível alterar o status.",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Identidades</h1>
        <p className="text-muted-foreground">Controle acesso, perfis e status dos usuários do sistema.</p>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <CardTitle>Usuários do sistema</CardTitle>
            <Input
              placeholder="Buscar usuários..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm bg-background"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-14 text-center">ID</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                : filteredUsers?.length === 0
                ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhum usuário encontrado.
                      </TableCell>
                    </TableRow>
                  )
                : filteredUsers?.map((user) => (
                    <TableRow key={user.id} className={!user.isActive ? "opacity-60" : ""}>
                      <TableCell className="text-center">
                        <span className="text-xs font-mono text-muted-foreground">{user.id}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.fullName}</span>
                            {DEMO_USERNAMES.includes(user.username) && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/50 text-amber-500 flex items-center gap-1">
                                <FlaskConical className="w-2.5 h-2.5" /> Demo
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">@{user.username}</span>
                          {user.requiresPasswordReset && (
                            <span className="text-xs text-amber-500 flex items-center gap-1 mt-0.5">
                              <KeyRound className="w-3 h-3" /> Redefinição pendente
                            </span>
                          )}
                          {user.totpEnabled && (
                            <span className="text-xs text-primary/70 flex items-center gap-1 mt-0.5">
                              <Shield className="w-3 h-3" /> 2FA ativo
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          defaultValue={user.role}
                          onValueChange={(val) => handleRoleChange(user.id, val)}
                          disabled={updateUserMutation.isPending}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <div className="flex items-center">
                                <Shield className="w-3 h-3 mr-2" /> Usuário
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center text-destructive">
                                <ShieldAlert className="w-3 h-3 mr-2" /> Admin
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{user.email}</TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex justify-center">
                              <Switch
                                checked={user.isActive}
                                onCheckedChange={(checked) =>
                                  handleToggleActive(user.id, checked, user.username)
                                }
                                disabled={toggleActiveMutation.isPending}
                                className="data-[state=checked]:bg-primary"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {user.isActive ? "Desativar usuário" : "Ativar usuário"}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                                  onClick={() => setUserToReset({ id: user.id, name: user.username })}
                                  disabled={resetPasswordMutation.isPending || DEMO_USERNAMES.includes(user.username)}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {DEMO_USERNAMES.includes(user.username)
                                ? "Senha de usuário demo não pode ser redefinida"
                                : "Redefinir senha"}
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setUserToDelete({ id: user.id, name: user.username })}
                                  disabled={DEMO_USERNAMES.includes(user.username)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {DEMO_USERNAMES.includes(user.username)
                                ? "Usuário demo não pode ser excluído"
                                : "Excluir usuário"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={userToDelete !== null} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>@{userToDelete?.name}</strong>? Esta ação remove
              o acesso imediatamente e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset password confirmation */}
      <AlertDialog open={userToReset !== null} onOpenChange={(open) => !open && setUserToReset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              Redefinir senha
            </AlertDialogTitle>
            <AlertDialogDescription>
              A senha de <strong>@{userToReset?.name}</strong> será apagada. Na próxima vez que o
              usuário informar o nome de conta e sair do campo, será solicitado que defina uma nova
              senha forte. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              Redefinir senha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
