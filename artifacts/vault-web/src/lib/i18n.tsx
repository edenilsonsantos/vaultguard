import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "pt-BR" | "en-US";

const ptBR = {
  nav: {
    system: "Sistema",
    dashboard: "Painel",
    vault: "Vault",
    trash: "Lixeira",
    auditLogs: "Registros de Auditoria",
    users: "Usuários",
    documentation: "Documentação",
    operationManual: "Manual de Operação",
    apiDocumentation: "Documentação da API",
    profile: "Perfil",
    settings: "Configurações",
    logout: "Desconectar",
  },
  dashboard: {
    title: "Painel",
    subtitle: "Visão geral do seu vault e atividade recente.",
    totalItems: "Total de Itens",
    totalItemsSub: (cred: number, vars: number) => `${cred} Credenciais, ${vars} Variáveis`,
    accessibleToMe: "Acessíveis para Mim",
    accessibleToMeSub: "Itens que você pode ler/editar",
    totalEntries: "Total de Entradas",
    totalEntriesSub: "Pares chave-valor armazenados",
    systemAccesses: "Acessos ao Sistema",
    systemAccessesSub: (n: number) => `De ${n} usuário(s) único(s)`,
    recentActivity: "Atividade Recente",
    recentActivitySub: "Últimos acessos e modificações",
    loadingActivity: "Carregando atividade...",
    noRecentActivity: "Sem atividade recente.",
    topAccessedItems: "Itens Mais Acessados",
    topAccessedItemsSub: "Segredos mais solicitados",
    loadingTopItems: "Carregando itens...",
    accesses: (n: number) => `${n} acessos`,
    noAccessData: "Sem dados de acesso.",
    actionRead: "leu",
    actionCreate: "criou",
    actionUpdate: "atualizou",
    actionDelete: "removeu",
    unknownIp: "IP desconhecido",
    dateFormat: "dd/MM/yyyy HH:mm:ss",
  },
  logs: {
    title: "Registros de Auditoria",
    subtitle: "Histórico imutável de 30 dias de todos os eventos do sistema.",
    totalEvents: "Total de Eventos",
    activeUsers: "Usuários Ativos",
    systemStatus: "Status do Sistema",
    systemStatusValue: "Registro Seguro Ativo",
    filterByUser: "Filtrar por Usuário",
    allUsers: "Todos os Usuários",
    filterByItem: "Filtrar por Item",
    allItems: "Todos os Itens",
    resetFilters: "Limpar Filtros",
    showing: (from: number, to: number, total: number) =>
      `Exibindo ${from} a ${to} de ${total} registros`,
    noEvents: "Nenhum evento encontrado com os filtros aplicados.",
  },
  lang: {
    label: "Idioma",
  },
};

const enUS: typeof ptBR = {
  nav: {
    system: "System",
    dashboard: "Dashboard",
    vault: "Vault",
    trash: "Trash",
    auditLogs: "Audit Logs",
    users: "Users",
    documentation: "Documentation",
    operationManual: "Operation Manual",
    apiDocumentation: "API Documentation",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
  },
  dashboard: {
    title: "Dashboard",
    subtitle: "Overview of your vault and recent activity.",
    totalItems: "Total Items",
    totalItemsSub: (cred: number, vars: number) => `${cred} Credentials, ${vars} Variables`,
    accessibleToMe: "Accessible to Me",
    accessibleToMeSub: "Items you can read/edit",
    totalEntries: "Total Entries",
    totalEntriesSub: "Stored key-value pairs",
    systemAccesses: "System Accesses",
    systemAccessesSub: (n: number) => `Across ${n} unique user(s)`,
    recentActivity: "Recent Activity",
    recentActivitySub: "Latest access and modifications",
    loadingActivity: "Loading activity...",
    noRecentActivity: "No recent activity.",
    topAccessedItems: "Top Accessed Items",
    topAccessedItemsSub: "Most frequently requested secrets",
    loadingTopItems: "Loading top items...",
    accesses: (n: number) => `${n} accesses`,
    noAccessData: "No access data available.",
    actionRead: "read",
    actionCreate: "created",
    actionUpdate: "updated",
    actionDelete: "deleted",
    unknownIp: "Unknown IP",
    dateFormat: "MMM d, yyyy HH:mm:ss",
  },
  logs: {
    title: "Audit Logs",
    subtitle: "Immutable 30-day history of all system events.",
    totalEvents: "Total Events",
    activeUsers: "Active Users",
    systemStatus: "System Status",
    systemStatusValue: "Secure Logging Active",
    filterByUser: "Filter by User",
    allUsers: "All Users",
    filterByItem: "Filter by Vault Item",
    allItems: "All Items",
    resetFilters: "Reset Filters",
    showing: (from: number, to: number, total: number) =>
      `Showing ${from} to ${to} of ${total} entries`,
    noEvents: "No events found with the applied filters.",
  },
  lang: {
    label: "Language",
  },
};

const translations: Record<Lang, typeof ptBR> = {
  "pt-BR": ptBR,
  "en-US": enUS,
};

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: typeof ptBR;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem("vg_lang");
    return (stored === "en-US" ? "en-US" : "pt-BR") as Lang;
  });

  function setLang(l: Lang) {
    localStorage.setItem("vg_lang", l);
    setLangState(l);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
