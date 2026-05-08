import { useState } from "react";
import {
  useGetVaultItem,
  useUpdateVaultItem,
  useDeleteVaultItem,
  useListUsers,
  getListVaultItemsQueryKey,
  getGetVaultItemQueryKey,
  getListAuditLogsQueryKey,
} from "@workspace/api-client-react";
import { useParams, useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Trash2, ArrowLeft, Edit, Save, X, KeyRound, Globe, User, Clock,
  Shield, Server, Plus, Lock, AlertTriangle, ShieldAlert, Hash,
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function VaultDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users } = useListUsers();

  const { data: item, isLoading } = useGetVaultItem(id, {
    query: { enabled: !!id, queryKey: getGetVaultItemQueryKey(id) },
  });

  const updateMutation = useUpdateVaultItem();
  const deleteMutation = useDeleteVaultItem();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<"credencial" | "variavel_global">("credencial");
  const [editDescription, setEditDescription] = useState("");
  const [editAccessControl, setEditAccessControl] = useState<"all" | "specific">("all");
  const [editAllowedUserIds, setEditAllowedUserIds] = useState<number[]>([]);
  const [editAllowedHostsMode, setEditAllowedHostsMode] = useState<"all" | "specific">("all");
  const [editAllowedHosts, setEditAllowedHosts] = useState<string[]>([]);
  const [editEntries, setEditEntries] = useState<{ key: string; value: string }[]>([]);
  const [newHostInput, setNewHostInput] = useState("");

  if (isLoading || !item) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isCredential = item.category === "credencial";

  function handleStartEdit() {
    if (!item) return;
    setEditName(item.name);
    setEditCategory(item.category as "credencial" | "variavel_global");
    setEditDescription(item.description ?? "");
    setEditAccessControl(item.accessControl as "all" | "specific");
    setEditAllowedUserIds(item.allowedUserIds ?? []);
    setEditAllowedHostsMode(item.allowedHostsMode as "all" | "specific");
    setEditAllowedHosts(item.allowedHosts ?? []);
    setEditEntries(item.entries.map((e) => ({ key: e.key, value: "" })));
    setIsEditing(true);
  }

  function handleSaveEdit() {
    updateMutation.mutate(
      {
        id,
        data: {
          name: editName,
          category: editCategory,
          description: editDescription || null,
          accessControl: editAccessControl,
          allowedUserIds: editAccessControl === "specific" ? editAllowedUserIds : [],
          allowedHostsMode: editAllowedHostsMode,
          allowedHosts: editAllowedHostsMode === "specific" ? editAllowedHosts : [],
          entries: editEntries,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetVaultItemQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListAuditLogsQueryKey() });
          setIsEditing(false);
          toast({ title: "Atualizado", description: "Vault item salvo com sucesso." });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível salvar as alterações." });
        },
      }
    );
  }

  function handleDelete() {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListVaultItemsQueryKey() });
          toast({ title: "Excluído", description: "Item removido do vault." });
          setLocation("/vault");
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Erro ao excluir", description: (err as any)?.data?.error || "Não foi possível remover o item." });
        },
      }
    );
  }

  function addEditHost() {
    const h = newHostInput.trim();
    if (!h || editAllowedHosts.includes(h)) return;
    setEditAllowedHosts([...editAllowedHosts, h]);
    setNewHostInput("");
  }

  function toggleEditUser(uid: number) {
    setEditAllowedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vault"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex items-center space-x-3">
            {isCredential ? (
              <KeyRound className="h-6 w-6 text-primary" />
            ) : (
              <Globe className="h-6 w-6 text-secondary-foreground" />
            )}
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xl font-bold w-64"
              />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
            )}
            <Badge variant={isCredential ? "default" : "secondary"}>
              {isCredential ? "Credencial" : "Var. Global"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={handleStartEdit}>
                <Edit className="h-4 w-4 mr-2" />Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. O item e todos os seus valores serão permanentemente removidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Sim, excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Entradas</CardTitle>
              <CardDescription>
                {isCredential
                  ? "Valores de credenciais são protegidos — acesse apenas via API com API key."
                  : "Variáveis globais são exibidas normalmente."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCredential && !isEditing && (
                <div className="flex items-start gap-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
                  <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Valores protegidos no browser</p>
                    <p className="text-xs mt-0.5 opacity-80">
                      Para visualizar os valores reais, utilize a API com sua API key e o IP desta VM autorizado.
                    </p>
                  </div>
                </div>
              )}

              {isEditing ? (
                <>
                  {editEntries.map((entry, idx) => (
                    <div key={idx} className="flex flex-col space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center gap-2">
                        <Input
                          value={entry.key}
                          onChange={(e) => {
                            const updated = [...editEntries];
                            updated[idx] = { ...updated[idx], key: e.target.value };
                            setEditEntries(updated);
                          }}
                          className="font-mono text-sm bg-background flex-1"
                          placeholder="Chave"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => setEditEntries(editEntries.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Input
                          value={entry.value}
                          onChange={(e) => {
                            const updated = [...editEntries];
                            updated[idx] = { ...updated[idx], value: e.target.value };
                            setEditEntries(updated);
                          }}
                          className="font-mono text-sm bg-background"
                          type={editCategory === "credencial" ? "password" : "text"}
                          placeholder={editCategory === "credencial" ? "Novo valor (deixe vazio para manter atual)" : "Valor"}
                        />
                        {editCategory === "credencial" && (
                          <p className="text-xs text-muted-foreground">Deixe vazio para manter o valor atual criptografado.</p>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditEntries([...editEntries, { key: "", value: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar entrada
                  </Button>
                </>
              ) : (
                <>
                  {item.entries.map((entry) => (
                    <div key={entry.key} className="flex flex-col space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-mono font-medium text-foreground">{entry.key}</span>
                        {isCredential && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Lock className="h-3 w-3" />
                            Somente via API
                          </Badge>
                        )}
                      </div>
                      <div className="font-mono text-sm bg-background p-2 rounded border border-border overflow-x-auto">
                        {isCredential ? (
                          <span className="text-muted-foreground italic">
                            ••••••••••••••• [Acesse via API para visualizar]
                          </span>
                        ) : (
                          entry.value
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* Category & Description (Edit) */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Select value={editCategory} onValueChange={(v) => setEditCategory(v as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credencial">Credencial</SelectItem>
                      <SelectItem value="variavel_global">Variável Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="mt-1"
                    placeholder="Descrição opcional"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Access (Edit) */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Controle de Acesso por Usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={editAccessControl} onValueChange={(v) => setEditAccessControl(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Usuários</SelectItem>
                    <SelectItem value="specific">Usuários Específicos</SelectItem>
                  </SelectContent>
                </Select>

                {editAccessControl === "specific" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border p-4 rounded-md max-h-48 overflow-y-auto">
                    {users?.map((u) => (
                      <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={editAllowedUserIds.includes(u.id)}
                          onCheckedChange={() => toggleEditUser(u.id)}
                        />
                        {u.username} ({u.fullName})
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* VM/Host Access (Edit) */}
          {isEditing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Restrição de Acesso via API por VM/Host
                </CardTitle>
                <CardDescription>
                  Somente os IPs/hostnames listados poderão consultar via API key.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={editAllowedHostsMode} onValueChange={(v) => setEditAllowedHostsMode(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Hosts</SelectItem>
                    <SelectItem value="specific">Hosts Específicos</SelectItem>
                  </SelectContent>
                </Select>

                {editAllowedHostsMode === "specific" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="ex: 192.168.1.10 ou vm-prod-01"
                        value={newHostInput}
                        onChange={(e) => setNewHostInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEditHost(); } }}
                      />
                      <Button type="button" variant="outline" onClick={addEditHost}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editAllowedHosts.map((h) => (
                        <Badge key={h} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                          <Server className="h-3 w-3" />
                          {h}
                          <button
                            type="button"
                            onClick={() => setEditAllowedHosts(editAllowedHosts.filter((x) => x !== h))}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {editAllowedHosts.length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhum host adicionado ainda.</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metadados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground flex items-center"><Hash className="h-3 w-3 mr-1" /> ID do Vault</span>
                <span className="font-mono font-bold text-primary text-base">{item.id}</span>
                <span className="text-xs text-muted-foreground">Use em <code className="bg-muted px-1 rounded">/api/vault/byID/{item.id}</code></span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground flex items-center"><User className="h-3 w-3 mr-1" /> Criado por</span>
                <span className="font-medium">{item.createdByUsername}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground flex items-center"><Clock className="h-3 w-3 mr-1" /> Criado em</span>
                <span>{format(new Date(item.createdAt), "dd/MM/yyyy HH:mm")}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground flex items-center"><Clock className="h-3 w-3 mr-1" /> Atualizado em</span>
                <span>{format(new Date(item.updatedAt), "dd/MM/yyyy HH:mm")}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground">Acesso por usuário</span>
                <Badge variant="outline" className="w-fit mt-1">
                  {item.accessControl === "all" ? "Todos" : `${item.allowedUserIds?.length ?? 0} específico(s)`}
                </Badge>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-muted-foreground flex items-center"><Server className="h-3 w-3 mr-1" /> Acesso por VM (API)</span>
                <Badge variant="outline" className="w-fit mt-1">
                  {item.allowedHostsMode === "all" ? "Todos os hosts" : `${item.allowedHosts?.length ?? 0} host(s)`}
                </Badge>
                {item.allowedHostsMode === "specific" && item.allowedHosts && item.allowedHosts.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.allowedHosts.map((h) => (
                      <Badge key={h} variant="secondary" className="text-xs gap-1">
                        <Server className="h-2.5 w-2.5" />
                        {h}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {item.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
              </CardContent>
            </Card>
          )}

          {isCredential && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary text-sm">
                  <Lock className="h-4 w-4" />
                  Proteção de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>Valores criptografados com AES-256-CBC em repouso.</p>
                <p>Nunca exibidos no browser — acesse via API key com IP autorizado.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
