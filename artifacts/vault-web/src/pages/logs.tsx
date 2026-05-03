import { useState } from "react";
import { useListAuditLogs, useListUsers, useListVaultItems, useGetAuditStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { format } from "date-fns";
import { ShieldAlert, ShieldCheck, Activity, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Logs() {
  const [page, setPage] = useState(1);
  const [userIdFilter, setUserIdFilter] = useState<string>("all");
  const [itemIdFilter, setItemIdFilter] = useState<string>("all");

  const { data: users } = useListUsers();
  const { data: vaultItems } = useListVaultItems();
  const { data: stats } = useGetAuditStats();

  const { data: logPage, isLoading } = useListAuditLogs(
    {
      userId: userIdFilter !== "all" ? parseInt(userIdFilter) : undefined,
      vaultItemId: itemIdFilter !== "all" ? parseInt(itemIdFilter) : undefined,
      page,
      pageSize: 20,
    },
    {
      query: {
        queryKey: ["/api/logs", userIdFilter, itemIdFilter, page],
      },
    }
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case 'read': return "bg-primary/20 text-primary border-primary/30";
      case 'create': return "bg-green-500/20 text-green-500 border-green-500/30";
      case 'update': return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case 'delete': return "bg-destructive/20 text-destructive border-destructive/30";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Immutable 30-day history of all system events.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-muted-foreground mb-2">
              <Activity className="h-4 w-4" />
              <h3 className="text-sm font-medium">Total Events</h3>
            </div>
            <div className="text-3xl font-bold">{stats?.totalAccesses ?? "..."}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-muted-foreground mb-2">
              <ShieldCheck className="h-4 w-4" />
              <h3 className="text-sm font-medium">Active Users</h3>
            </div>
            <div className="text-3xl font-bold">{stats?.uniqueUsers ?? "..."}</div>
          </CardContent>
        </Card>
        <Card className="bg-card md:col-span-1 bg-destructive/10 border-destructive/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-destructive mb-2">
              <ShieldAlert className="h-4 w-4" />
              <h3 className="text-sm font-medium">System Status</h3>
            </div>
            <div className="text-lg font-semibold text-destructive">Secure Logging Active</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Select value={userIdFilter} onValueChange={(v) => { setUserIdFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users?.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>@{u.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={itemIdFilter} onValueChange={(v) => { setItemIdFilter(v); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by Vault Item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    {vaultItems?.map(v => (
                      <SelectItem key={v.id} value={v.id.toString()}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="outline" onClick={() => {
              setUserIdFilter("all");
              setItemIdFilter("all");
              setPage(1);
            }}>
              Reset Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target Item</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="hidden md:table-cell">Client</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
                    </TableRow>
                  ))
                ) : logPage?.logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      <Search className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                      No audit events found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  logPage?.logs.map((log) => (
                    <TableRow key={log.id} className="font-mono text-sm">
                      <TableCell className="text-muted-foreground">
                        {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        @{log.username}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`uppercase text-[10px] px-2 py-0 h-5 ${getActionColor(log.action)}`}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="truncate max-w-[200px]">
                        {log.vaultItemName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.ipAddress || '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[200px]" title={log.userAgent || ''}>
                        {log.userAgent || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {logPage && logPage.total > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * logPage.pageSize) + 1} to {Math.min(page * logPage.pageSize, logPage.total)} of {logPage.total} entries
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center px-4 text-sm font-medium">
                  {page}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * logPage.pageSize >= logPage.total || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
