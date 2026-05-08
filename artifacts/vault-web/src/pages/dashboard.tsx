import { useGetVaultStats, useGetAuditStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldAlert, KeyRound, Database, Activity, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { useLang } from "@/lib/i18n";

export default function Dashboard() {
  const { data: stats, isLoading: isStatsLoading } = useGetVaultStats();
  const { data: auditStats, isLoading: isAuditLoading } = useGetAuditStats();
  const { t } = useLang();
  const d = t.dashboard;

  function actionLabel(action: string) {
    switch (action) {
      case "read": return d.actionRead;
      case "create": return d.actionCreate;
      case "update": return d.actionUpdate;
      case "delete": return d.actionDelete;
      default: return action;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{d.title}</h1>
        <p className="text-muted-foreground">{d.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{d.totalItems}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isStatsLoading ? "..." : stats?.totalItems ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {d.totalItemsSub(stats?.credentialCount ?? 0, stats?.globalVarCount ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{d.accessibleToMe}</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isStatsLoading ? "..." : stats?.accessibleToMe ?? 0}</div>
            <p className="text-xs text-muted-foreground">{d.accessibleToMeSub}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{d.totalEntries}</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isStatsLoading ? "..." : stats?.totalEntries ?? 0}</div>
            <p className="text-xs text-muted-foreground">{d.totalEntriesSub}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{d.systemAccesses}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isAuditLoading ? "..." : auditStats?.totalAccesses ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              {d.systemAccessesSub(auditStats?.uniqueUsers ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{d.recentActivity}</CardTitle>
            <CardDescription>{d.recentActivitySub}</CardDescription>
          </CardHeader>
          <CardContent>
            {isAuditLoading ? (
              <div className="text-sm text-muted-foreground">{d.loadingActivity}</div>
            ) : auditStats?.recentActivity && auditStats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {auditStats.recentActivity.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {log.action === 'read'
                        ? <ShieldCheck className="h-4 w-4 text-primary" />
                        : <ShieldAlert className="h-4 w-4 text-destructive" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {log.username} {actionLabel(log.action)} {log.vaultItemName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), d.dateFormat)} · {log.ipAddress || d.unknownIp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">{d.noRecentActivity}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{d.topAccessedItems}</CardTitle>
            <CardDescription>{d.topAccessedItemsSub}</CardDescription>
          </CardHeader>
          <CardContent>
            {isAuditLoading ? (
              <div className="text-sm text-muted-foreground">{d.loadingTopItems}</div>
            ) : auditStats?.topAccessedItems && auditStats.topAccessedItems.length > 0 ? (
              <div className="space-y-4">
                {auditStats.topAccessedItems.map((item) => (
                  <div key={item.vaultItemId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.vaultItemName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                      {d.accesses(item.accessCount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">{d.noAccessData}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
