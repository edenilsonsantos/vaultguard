import { useListVaultItems } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, KeyRound, Globe, Clock, ShieldAlert } from "lucide-react";
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
    (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vault</h1>
          <p className="text-muted-foreground">Manage your credentials and global variables.</p>
        </div>
        <Link href="/vault/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Secret
          </Button>
        </Link>
      </div>

      <div className="flex items-center">
        <Input 
          placeholder="Search items..." 
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
            <h3 className="mt-4 text-lg font-semibold">No items found</h3>
            <p className="text-sm text-muted-foreground">
              {search ? "No items matched your search." : "Create your first vault item to get started."}
            </p>
            {!search && (
              <Link href="/vault/new">
                <Button variant="outline" className="mt-4">
                  Create Item
                </Button>
              </Link>
            )}
          </div>
        ) : (
          filteredItems?.map((item) => (
            <Card key={item.id} className="flex flex-col hover:border-primary/50 transition-colors group">
              <CardHeader className="pb-2 flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {item.category === "credencial" ? (
                      <KeyRound className="h-4 w-4 text-primary" />
                    ) : (
                      <Globe className="h-4 w-4 text-secondary-foreground" />
                    )}
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      <Link href={`/vault/${item.id}`} className="hover:underline">
                        {item.name}
                      </Link>
                    </CardTitle>
                  </div>
                  <Badge variant={item.category === "credencial" ? "default" : "secondary"}>
                    {item.category === "credencial" ? "Credential" : "Global Var"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 mt-2 min-h-[2.5rem]">
                  {item.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground mt-4 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Updated {format(new Date(item.updatedAt), 'MMM d, yyyy')}</span>
                </div>
                <Badge variant="outline">{item.entryCount} entries</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
