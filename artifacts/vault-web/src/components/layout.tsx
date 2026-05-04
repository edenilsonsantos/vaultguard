import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Shield, LayoutDashboard, KeyRound, Users, Activity, UserCircle,
  LogOut, Settings, BookOpen, Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Vault", href: "/vault", icon: KeyRound },
    { name: "Audit Logs", href: "/logs", icon: Activity },
    ...(isAdmin ? [{ name: "Usuários", href: "/users", icon: Users }] : []),
  ];

  const publicLinks = [
    { name: "Manual de Operação", href: "/manual", icon: BookOpen },
    { name: "Documentação da API", href: "/api-manual", icon: Code2 },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Shield className="w-6 h-6 text-primary mr-3" />
          <span className="font-bold text-lg tracking-tight">VaultGuard</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {/* Sistema nav */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
              Sistema
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Documentação nav */}
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
              Documentação
            </div>
            {publicLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <div className="space-y-1">
            <Link
              href="/profile"
              className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                location === "/profile"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
              )}
            >
              <UserCircle className="w-4 h-4 mr-3" />
              Perfil
            </Link>
            {isAdmin && (
              <Link
                href="/settings"
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                  location === "/settings"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                )}
              >
                <Settings className="w-4 h-4 mr-3" />
                Configurações
              </Link>
            )}
            <button
              onClick={() => logout()}
              className="flex items-center w-full px-3 py-2 text-sm rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Desconectar
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 flex items-center px-4 border-b border-border bg-background md:hidden shrink-0">
          <Shield className="w-6 h-6 text-primary mr-3" />
          <span className="font-bold text-lg tracking-tight">VaultGuard</span>
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
