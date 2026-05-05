import { useListVaultItems } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, KeyRound, Globe, Clock, ShieldAlert, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useState } from "react";

export default function VaultList() {
  const { data: items, isLoading } = useListVaultItems();
  const [search, setSearch] = useState("");

  const filteredItems = items?.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    String(item.id).includes(search) ||
    (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vault</h1>
          <p className="text-muted-foreground">Gerencie suas credenciais e variáveis globais.</p>
        </div>
        <Link href="/vault/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Item
          </Button>
        </Link>
      </div>

      <div className="flex items-center">
        <Input
          placeholder="Buscar por nome, ID ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-card"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))
        ) : filteredItems?.length === 0 ? (
          <div className="col-span-full py-12 text-center border rounded-lg border-dashed">
            <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhum item encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {search ? "Nenhum item correspondeu à sua busca." : "Crie seu primeiro item no vault para começar."}
            </p>
            {!search && (
              <Link href="/vault/new">
                <Button variant="outline" className="mt-4">
                  Criar item
                </Button>
              </Link>
            )}
          </div>
        ) : (
          filteredItems?.map((item) => (
            <Card key={item.id} className="flex flex-col hover:border-primary/50 transition-colors group">
              <CardHeader className="pb-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    {item.category === "credencial" ? (
                      <KeyRound className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <Globe className="h-4 w-4 text-secondary-foreground shrink-0" />
                    )}
                    <CardTitle className="text-base group-hover:text-primary transition-colors truncate">
                      <Link href={`/vault/${item.id}`} className="hover:underline">
                        {item.name}
                      </Link>
                    </CardTitle>
                  </div>
                  <Badge variant={item.category === "credencial" ? "default" : "secondary"} className="shrink-0">
                    {item.category === "credencial" ? "Credencial" : "Var. Global"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-2 min-h-[2.5rem]">
                  {item.description || "Sem descrição."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground flex items-center justify-between border-t border-border pt-3 pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-mono text-primary/80 font-semibold">
                    <Hash className="h-3 w-3" />{item.id}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(item.updatedAt), "dd/MM/yyyy")}
                  </span>
                </div>
                <Badge variant="outline">{item.entryCount} entradas</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
