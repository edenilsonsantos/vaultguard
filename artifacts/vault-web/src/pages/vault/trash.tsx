import {
  useListVaultTrash,
  useRestoreVaultItem,
  usePermanentDeleteVaultItem,
  getListVaultTrashQueryKey,
  getListVaultItemsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Trash2, RotateCcw, KeyRound, Globe, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function VaultTrash() {
  const { data: items, isLoading } = useListVaultTrash();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const restoreMutation = useRestoreVaultItem();
  const permanentDeleteMutation = usePermanentDeleteVaultItem();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListVaultTrashQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListVaultItemsQueryKey() });
  }

  function handleRestore(id: number, name: string) {
    restoreMutation.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Item restaurado", description: `"${name}" foi movido de volta ao vault.` });
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Erro ao restaurar", description: (err as any)?.data?.error || "Não foi possível restaurar o item." });
        },
      }
    );
  }

  function handlePermanentDelete(id: number, name: string) {
    permanentDeleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "Excluído permanentemente", description: `"${name}" foi removido definitivamente.` });
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Erro ao excluir", description: (err as any)?.data?.error || "Não foi possível excluir o item." });
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vault"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trash2 className="h-7 w-7 text-muted-foreground" />
            Lixeira
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Itens movidos para lixeira podem ser restaurados a qualquer momento ou excluídos permanentemente.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
              </CardHeader>
              <CardContent><Skeleton className="h-10 w-full mt-4" /></CardContent>
            </Card>
          ))}
        </div>
      ) : items?.length === 0 ? (
        <div className="py-16 text-center border rounded-lg border-dashed">
          <Trash2 className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">Lixeira vazia</h3>
          <p className="text-sm text-muted-foreground mt-1">Nenhum item foi movido para a lixeira ainda.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/vault">Ir para o Vault</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items?.map((item) => (
            <Card key={item.id} className="flex flex-col border-destructive/20 bg-destructive/5 hover:border-destructive/40 transition-colors">
              <CardHeader className="pb-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    {item.category === "credencial" ? (
                      <KeyRound className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Globe className="h-4 w-4 text-secondary-foreground shrink-0" />
                    )}
                    <CardTitle className="text-base truncate">{item.name}</CardTitle>
                  </div>
                  <Badge variant={item.category === "credencial" ? "default" : "secondary"} className="shrink-0">
                    {item.category === "credencial" ? "Credencial" : "Var. Global"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-2 min-h-[2.5rem]">
                  {item.description || "Sem descrição."}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-destructive/80 bg-destructive/10 border border-destructive/20 rounded px-2 py-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Excluído{" "}
                    {formatDistanceToNow(new Date(item.deletedAt), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-primary/40 text-primary hover:bg-primary/10"
                    disabled={restoreMutation.isPending}
                    onClick={() => handleRestore(item.id, item.name)}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Restaurar
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O item <strong>"{item.name}"</strong> e todas as suas entradas serão removidos definitivamente. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handlePermanentDelete(item.id, item.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir permanentemente
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Criado em {format(new Date(item.createdAt), "dd/MM/yyyy")} · {item.entryCount} entrada(s)
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
