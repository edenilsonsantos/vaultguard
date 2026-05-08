import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Shield, LayoutDashboard, KeyRound, Users, Activity, UserCircle,
  LogOut, Settings, BookOpen, Code2, Menu, X, ExternalLink, Trash2, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, type Lang } from "@/lib/i18n";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t, lang, setLang } = useLang();
  const nav = t.nav;

  const navItems = [
    { name: nav.dashboard, href: "/", icon: LayoutDashboard },
    { name: nav.vault, href: "/vault", icon: KeyRound },
    { name: nav.trash, href: "/vault/trash", icon: Trash2 },
    { name: nav.auditLogs, href: "/logs", icon: Activity },
    ...(isAdmin ? [{ name: nav.users, href: "/users", icon: Users }] : []),
  ];

  const publicLinks = [
    { name: nav.operationManual, href: "/manual", icon: BookOpen },
    { name: nav.apiDocumentation, href: "/api-manual", icon: Code2 },
  ];

  const footerLinks = [
    { name: nav.profile, href: "/profile", icon: UserCircle },
    ...(isAdmin ? [{ name: nav.settings, href: "/settings", icon: Settings }] : []),
  ];

  function closeSidebar() {
    setSidebarOpen(false);
  }

  useEffect(() => {
    closeSidebar();
  }, [location]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const LANGS: { value: Lang; label: string }[] = [
    { value: "pt-BR", label: "PT" },
    { value: "en-US", label: "EN" },
  ];

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
        <div className="flex items-center">
          <Shield className="w-6 h-6 text-primary mr-3" />
          <span className="font-bold text-lg tracking-tight">VaultGuard</span>
        </div>
        <button
          onClick={closeSidebar}
          className="md:hidden p-1 rounded-md text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
            {nav.system}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm rounded-md transition-colors",
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

        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
            {nav.documentation}
          </div>
          {publicLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm rounded-md transition-colors",
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
          <a
            href="/api/swagger"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-3 py-2.5 text-sm rounded-md transition-colors text-muted-foreground hover:bg-accent/5 hover:text-foreground"
          >
            <ExternalLink className="w-4 h-4 mr-3" />
            Swagger UI
          </a>
        </div>
      </div>

      <div className="p-4 border-t border-border shrink-0 space-y-1">
        {/* Language switcher */}
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground flex-1">{t.lang.label}</span>
          <div className="flex rounded-md border border-border overflow-hidden">
            {LANGS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLang(l.value)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium transition-colors",
                  lang === l.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {footerLinks.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2.5 text-sm rounded-md transition-colors",
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
        <button
          onClick={() => { logout(); closeSidebar(); }}
          className="flex items-center w-full px-3 py-2.5 text-sm rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
        >
          <LogOut className="w-4 h-4 mr-3" />
          {nav.logout}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* Sidebar — desktop (always visible) */}
      <aside className="w-64 border-r border-border bg-sidebar hidden md:flex flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile drawer overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={closeSidebar}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-sidebar border-r border-border flex flex-col md:hidden transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile header with hamburger */}
        <header className="h-16 flex items-center px-4 border-b border-border bg-background md:hidden shrink-0 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold text-base tracking-tight">VaultGuard</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
