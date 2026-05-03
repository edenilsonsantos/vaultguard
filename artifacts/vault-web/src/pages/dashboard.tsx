import { useGetVaultStats, useGetAuditStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert, KeyRound, Database, Activity, ShieldCheck, Users } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: isStatsLoading } = useGetVaultStats();
  const { data: auditStats, isLoading: isAuditLoading } = useGetAuditStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your vault and recent activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isStatsLoading ? "..." : stats?.totalItems ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.credentialCount ?? 0} Credentials, {stats?.globalVarCount ?? 0} Variables
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accessible to Me</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isStatsLoading ? "..." : stats?.accessibleToMe ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Items you can read/edit
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isStatsLoading ? "..." : stats?.totalEntries ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Stored key-value pairs
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Accesses</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isAuditLoading ? "..." : auditStats?.totalAccesses ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Across {auditStats?.uniqueUsers ?? 0} unique users
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest access and modifications</CardDescription>
          </CardHeader>
          <CardContent>
            {isAuditLoading ? (
              <div className="text-sm text-muted-foreground">Loading activity...</div>
            ) : auditStats?.recentActivity && auditStats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {auditStats.recentActivity.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {log.action === 'read' ? <ShieldCheck className="h-4 w-4 text-primary" /> : <ShieldAlert className="h-4 w-4 text-destructive" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {log.username} {log.action === "read" ? "read" : log.action} {log.vaultItemName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')} • {log.ipAddress || 'Unknown IP'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No recent activity.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Accessed Items</CardTitle>
            <CardDescription>Most frequently requested secrets</CardDescription>
          </CardHeader>
          <CardContent>
            {isAuditLoading ? (
              <div className="text-sm text-muted-foreground">Loading top items...</div>
            ) : auditStats?.topAccessedItems && auditStats.topAccessedItems.length > 0 ? (
              <div className="space-y-4">
                {auditStats.topAccessedItems.map((item) => (
                  <div key={item.vaultItemId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.vaultItemName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                      {item.accessCount} accesses
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No access data available.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
