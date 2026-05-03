import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Shield, LayoutDashboard, KeyRound, Users, Activity, UserCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Vault", href: "/vault", icon: KeyRound },
  { name: "Audit Logs", href: "/logs", icon: Activity },
  { name: "Users", href: "/users", icon: Users },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Shield className="w-6 h-6 text-primary mr-3" />
          <span className="font-bold text-lg tracking-tight">VaultGuard</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
              System
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
              Profile
            </Link>
            <button
              onClick={() => logout()}
              className="flex items-center w-full px-3 py-2 text-sm rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Disconnect
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="h-16 flex items-center px-4 border-b border-border bg-background md:hidden shrink-0">
          <Shield className="w-6 h-6 text-primary mr-3" />
          <span className="font-bold text-lg tracking-tight">VaultGuard</span>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
