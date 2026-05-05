import { Link } from "wouter";
import { Shield, KeyRound, Globe, Lock, Server, Code2, BookOpen, ChevronRight, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2 border-b border-border pb-3">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {n}
      </div>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function InfoBox({ title, children, color = "blue" }: { title: string; children: React.ReactNode; color?: string }) {
  const cls = color === "amber"
    ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
    : color === "green"
      ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
      : "bg-primary/10 border-primary/30 text-primary";
  return (
    <div className={`p-4 rounded-md border ${cls} text-sm`}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div className="opacity-90">{children}</div>
    </div>
  );
}

function MockScreen({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden shadow-lg bg-card">
      <div className="bg-muted/50 border-b border-border px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <div className="w-3 h-3 rounded-full bg-green-400/70" />
        </div>
        <span className="text-xs text-muted-foreground font-mono ml-2">vaultguard.app — {label}</span>
      </div>
      <div className="p-4 bg-background/60">{children}</div>
    </div>
  );
}

const toc = [
  { id: "introducao", label: "1. Introdução" },
  { id: "login", label: "2. Login e Autenticação" },
  { id: "dashboard", label: "3. Dashboard" },
  { id: "vault-list", label: "4. Lista de Vault" },
  { id: "vault-criar", label: "5. Criar um Vault" },
  { id: "vault-detalhe", label: "6. Visualizar e Editar um Vault" },
  { id: "usuarios", label: "7. Gestão de Usuários (Admin)" },
  { id: "configuracoes", label: "8. Configurações (Admin)" },
  { id: "perfil", label: "9. Perfil e 2FA" },
  { id: "logs", label: "10. Logs de Auditoria" },
];

export default function Manual() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">VaultGuard</span>
            <Badge variant="outline" className="ml-1 text-xs">Manual de Operação</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/api-manual" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Code2 className="h-4 w-4" /> Documentação da API
            </Link>
            <Link href="/login" className="text-primary hover:underline font-medium">Fazer Login →</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Neste manual</p>
            <nav className="space-y-1">
              {toc.map((t) => (
                <a key={t.id} href={`#${t.id}`}
                  className="block text-sm text-muted-foreground hover:text-foreground py-1 px-2 rounded hover:bg-accent/5 transition-colors">
                  {t.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 space-y-14 min-w-0">

          {/* Hero */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-sm text-primary font-medium">Manual do Usuário</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Manual de Operação do VaultGuard</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Guia completo para operação do sistema de cofre de senhas e variáveis via browser.
              Aprenda a criar, editar e gerenciar segredos de forma segura.
            </p>
            <InfoBox title="" color="blue">
              Este manual utiliza dados fictícios para fins de demonstração. Nenhum dado real é exposto.
            </InfoBox>
          </div>

          {/* 1. Introdução */}
          <Section id="introducao" title="1. Introdução">
            <p className="text-muted-foreground">
              O <strong className="text-foreground">VaultGuard</strong> é um sistema centralizado de armazenamento
              seguro de credenciais e variáveis globais. Permite que equipes de TI gerenciem segredos como senhas
              de banco de dados, tokens de API e configurações de infraestrutura com controle de acesso granular.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {[
                { icon: <KeyRound className="h-6 w-6 text-primary" />, title: "Credenciais", desc: "Senhas e tokens — valores nunca exibidos no browser, somente via API key autorizada." },
                { icon: <Globe className="h-6 w-6 text-secondary-foreground" />, title: "Variáveis Globais", desc: "URLs, configurações e parâmetros — valores visíveis normalmente no sistema." },
                { icon: <Lock className="h-6 w-6 text-primary" />, title: "Criptografia", desc: "Todos os valores são armazenados criptografados com AES-256-CBC em repouso." },
              ].map((c) => (
                <div key={c.title} className="border border-border rounded-lg p-4 space-y-2">
                  {c.icon}
                  <p className="font-semibold text-sm">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* 2. Login */}
          <Section id="login" title="2. Login e Autenticação">
            <p className="text-muted-foreground">A tela de login é o ponto de entrada do sistema. Suporta login com senha e autenticação de dois fatores (2FA).</p>

            <MockScreen label="/login">
              <div className="max-w-sm mx-auto space-y-3">
                <div className="text-center space-y-1">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-bold">VaultGuard</p>
                  <p className="text-xs text-muted-foreground">Insira suas credenciais para acessar o cofre</p>
                </div>
                <div className="space-y-2">
                  <div className="border border-border rounded-md px-3 py-2 text-sm bg-muted/30 font-mono">joao.silva</div>
                  <div className="border border-border rounded-md px-3 py-2 text-sm bg-muted/30 font-mono">••••••••••••</div>
                  <div className="bg-primary rounded-md py-2 text-center text-primary-foreground text-sm font-medium">Autenticar</div>
                </div>
                <div className="border border-border/50 rounded-lg p-3 bg-muted/20 text-xs">
                  <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-[10px]">Credenciais de Demonstração</p>
                  <div className="space-y-1 font-mono text-muted-foreground">
                    <p><span className="text-primary">Admin</span> user: demo_admin · pass: ••••••</p>
                    <p><span className="text-secondary-foreground">Usuário</span> user: demo_user · pass: ••••••</p>
                  </div>
                </div>
              </div>
            </MockScreen>

            <SubSection title="Login padrão">
              <div className="space-y-2">
                <Step n={1}>Digite seu <strong>nome de usuário</strong> no campo "Usuário".</Step>
                <Step n={2}>Digite sua <strong>senha</strong> no campo "Senha". Use o ícone do olho para mostrar/ocultar.</Step>
                <Step n={3}>Clique em <strong>"Autenticar"</strong>.</Step>
                <Step n={4}>Se as credenciais estiverem corretas, você será redirecionado ao Dashboard.</Step>
              </div>
            </SubSection>

            <SubSection title="Login com 2FA ativo">
              <div className="space-y-2">
                <Step n={1}>Após digitar usuário/senha e clicar em Autenticar, se o usuário tiver 2FA ativo, a tela exibirá um campo de <strong>código OTP</strong>.</Step>
                <Step n={2}>Abra seu aplicativo autenticador (Google Authenticator, Authy etc.) e copie o código de 6 dígitos.</Step>
                <Step n={3}>Digite o código e clique em <strong>"Verificar"</strong>.</Step>
              </div>
            </SubSection>

            <SubSection title="Redefinição de senha forçada (admin reset)">
              <InfoBox title="Quando ocorre?" color="amber">
                Se o administrador resetou sua senha, ao digitar seu usuário e sair do campo (Tab/clique), o sistema detecta automaticamente e exibe um diálogo para definir nova senha.
              </InfoBox>
              <div className="space-y-2 mt-3">
                <Step n={1}>Digite seu nome de usuário e pressione Tab ou clique em outro campo.</Step>
                <Step n={2}>Um diálogo <strong>"Redefinição de senha obrigatória"</strong> será exibido automaticamente.</Step>
                <Step n={3}>Digite a nova senha (mínimo 12 caracteres, com maiúscula, minúscula, número e caractere especial).</Step>
                <Step n={4}>Confirme a nova senha e clique em <strong>"Definir nova senha"</strong>. Você será logado automaticamente.</Step>
              </div>
            </SubSection>
          </Section>

          {/* 3. Dashboard */}
          <Section id="dashboard" title="3. Dashboard">
            <p className="text-muted-foreground">O dashboard exibe um resumo do estado do vault e atividades recentes.</p>

            <MockScreen label="/ — Dashboard">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Total de Itens", value: "12" },
                  { label: "Credenciais", value: "8" },
                  { label: "Var. Globais", value: "4" },
                  { label: "Acessíveis a mim", value: "10" },
                ].map((s) => (
                  <div key={s.label} className="border border-border rounded-lg p-3 bg-muted/20 text-center">
                    <p className="text-2xl font-bold text-primary">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="border border-border rounded-lg p-3 bg-muted/10">
                <p className="text-xs font-semibold text-muted-foreground mb-2">ATIVIDADE RECENTE</p>
                <div className="space-y-2">
                  {[
                    { user: "joao.silva", item: "BD-Producao", time: "2 min atrás" },
                    { user: "maria.ops", item: "API-Stripe-Prod", time: "15 min atrás" },
                    { user: "carlos.dev", item: "ENV-Backend", time: "1h atrás" },
                  ].map((l, i) => (
                    <div key={i} className="flex justify-between text-xs text-muted-foreground">
                      <span><span className="text-foreground font-medium">{l.user}</span> acessou <span className="text-primary">{l.item}</span></span>
                      <span>{l.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </MockScreen>
          </Section>

          {/* 4. Lista de Vault */}
          <Section id="vault-list" title="4. Lista de Vault">
            <p className="text-muted-foreground">A página Vault exibe todos os itens que você tem permissão de acessar, com o ID de cada um visível diretamente nos cards.</p>

            <MockScreen label="/vault">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-lg">Vault</p>
                    <p className="text-xs text-muted-foreground">Gerencie suas credenciais e variáveis globais.</p>
                  </div>
                  <div className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-md font-medium">+ Novo Item</div>
                </div>
                <div className="border border-border rounded-md px-3 py-2 text-xs text-muted-foreground bg-muted/20">Buscar por nome, ID ou descrição...</div>
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    { id: 7,  name: "BD-Producao",    type: "credencial",    entries: 3, desc: "Banco de dados PostgreSQL de produção" },
                    { id: 12, name: "API-Stripe-Prod", type: "credencial",    entries: 2, desc: "Chaves de API do Stripe produção" },
                    { id: 15, name: "ENV-Backend",     type: "variavel_global", entries: 8, desc: "Variáveis de ambiente do backend" },
                  ].map((item) => (
                    <div key={item.name} className="border border-border rounded-lg p-3 bg-muted/10 space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {item.type === "credencial"
                            ? <KeyRound className="h-3.5 w-3.5 text-primary shrink-0" />
                            : <Globe className="h-3.5 w-3.5 shrink-0" />}
                          <span className="text-sm font-semibold truncate">{item.name}</span>
                        </div>
                        <Badge variant={item.type === "credencial" ? "default" : "secondary"} className="text-[10px] shrink-0">
                          {item.type === "credencial" ? "Credencial" : "Var. Global"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                      <div className="flex justify-between text-[10px] text-muted-foreground border-t border-border pt-2 items-center">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5 font-mono text-primary/80 font-semibold">
                            <Hash className="h-2.5 w-2.5" />{item.id}
                          </span>
                          <span>04/05/2026</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{item.entries} entradas</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </MockScreen>

            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside mt-3">
              <li>O <strong>ID numérico</strong> de cada vault aparece em destaque no rodapé do card (ex: <span className="font-mono text-xs text-primary">#7</span>). Use-o para consultas via API.</li>
              <li>Use a caixa de busca para filtrar por <strong>nome</strong>, <strong>ID</strong> ou <strong>descrição</strong>.</li>
              <li>Ícone de <KeyRound className="h-3.5 w-3.5 inline" /> indica <strong>Credencial</strong> (valores protegidos, acessíveis somente via API Key).</li>
              <li>Ícone de <Globe className="h-3.5 w-3.5 inline" /> indica <strong>Variável Global</strong> (valores visíveis no browser).</li>
              <li>Clique em qualquer card para ver os detalhes e o ID completo com exemplo de uso na API.</li>
              <li>Botão <strong>"+ Novo Item"</strong> abre o formulário de criação.</li>
            </ul>
          </Section>

          {/* 5. Criar Vault */}
          <Section id="vault-criar" title="5. Criar um Vault">
            <p className="text-muted-foreground">O formulário de criação é dividido em 4 cards: Informações Básicas, Controle de Acesso por Usuário, Restrição por VM/Host e Entradas.</p>

            <SubSection title="5.1 Informações Básicas">
              <div className="space-y-2">
                <Step n={1}><strong>Nome:</strong> Digite um nome descritivo (ex: "BD-Producao-App1").</Step>
                <Step n={2}><strong>Categoria:</strong> Selecione "Credencial" para senhas/tokens, ou "Variável Global" para configurações.</Step>
                <Step n={3}><strong>Descrição (opcional):</strong> Explique o propósito do item.</Step>
              </div>
              <InfoBox title="Diferença entre categorias" color="amber">
                <strong>Credencial:</strong> valores nunca exibidos no browser — apenas via API key com IP autorizado.<br />
                <strong>Variável Global:</strong> valores visíveis normalmente para usuários com acesso.
              </InfoBox>
            </SubSection>

            <SubSection title="5.2 Controle de Acesso por Usuário">
              <div className="space-y-2">
                <Step n={1}><strong>Todos os Usuários:</strong> qualquer usuário autenticado pode acessar este item.</Step>
                <Step n={2}><strong>Usuários Específicos:</strong> selecione na lista quais usuários têm permissão. O criador sempre tem acesso.</Step>
              </div>
            </SubSection>

            <SubSection title="5.3 Restrição de Acesso via API por VM/Host">
              <div className="space-y-2">
                <Step n={1}><strong>Todos os Hosts:</strong> qualquer máquina com uma API key válida pode consultar este vault via API.</Step>
                <Step n={2}><strong>Hosts Específicos:</strong> somente os IPs/hostnames listados podem fazer consultas via API key.</Step>
                <Step n={3}>Para adicionar um host: digite o IP ou hostname (ex: <code className="font-mono bg-muted px-1 rounded text-xs">192.168.1.10</code>) e pressione Enter ou clique no botão <strong>"+"</strong>.</Step>
                <Step n={4}>Os hosts adicionados aparecem como tags. Clique no <strong>X</strong> para remover.</Step>
              </div>
              <InfoBox title="Exemplo de uso" color="green">
                Vault "BD-Producao": restrinja o acesso via API apenas aos IPs <code className="font-mono">10.0.1.50</code> (VM de app) e <code className="font-mono">10.0.1.51</code> (VM de job). Outras máquinas receberão 403 mesmo com API key válida.
              </InfoBox>
            </SubSection>

            <SubSection title="5.4 Entradas Chave-Valor">
              <div className="space-y-2">
                <Step n={1}>Cada entrada possui uma <strong>chave</strong> (nome do parâmetro) e um <strong>valor</strong> (o segredo).</Step>
                <Step n={2}>Clique em <strong>"Adicionar"</strong> para incluir mais entradas.</Step>
                <Step n={3}>Para credenciais, o campo de valor é mascarado (<code className="font-mono text-xs">••••</code>) na digitação.</Step>
                <Step n={4}>Clique na lixeira para remover uma entrada (mínimo 1 entrada obrigatória).</Step>
                <Step n={5}>Clique em <strong>"Armazenar Segredo"</strong> para salvar.</Step>
              </div>

              <MockScreen label="/vault/new — Entradas">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 border border-border rounded-md px-3 py-2 text-xs font-mono bg-muted/20">DB_HOST</div>
                    <div className="flex-1 border border-border rounded-md px-3 py-2 text-xs font-mono bg-muted/20">postgres.prod.internal</div>
                    <div className="w-8 h-8 flex items-center justify-center text-destructive/50">🗑</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 border border-border rounded-md px-3 py-2 text-xs font-mono bg-muted/20">DB_PASSWORD</div>
                    <div className="flex-1 border border-border rounded-md px-3 py-2 text-xs font-mono bg-muted/20 text-muted-foreground">••••••••••••••••</div>
                    <div className="w-8 h-8 flex items-center justify-center text-destructive/50">🗑</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 border border-border rounded-md px-3 py-2 text-xs font-mono bg-muted/20">DB_PORT</div>
                    <div className="flex-1 border border-border rounded-md px-3 py-2 text-xs font-mono bg-muted/20 text-muted-foreground">••••</div>
                    <div className="w-8 h-8 flex items-center justify-center text-destructive/50">🗑</div>
                  </div>
                  <div className="border border-dashed border-border rounded-md py-2 text-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/10">
                    + Adicionar entrada
                  </div>
                </div>
              </MockScreen>
            </SubSection>
          </Section>

          {/* 6. Visualizar e Editar */}
          <Section id="vault-detalhe" title="6. Visualizar e Editar um Vault">
            <p className="text-muted-foreground">Clique em um item do vault para ver seus detalhes. Administradores podem editar todos os campos.</p>

            <SubSection title="6.1 ID do Vault e referência para API">
              <p className="text-sm text-muted-foreground">
                Cada vault possui um <strong>ID numérico único</strong>, exibido no card de <strong>Metadados</strong> na coluna direita da página de detalhes.
                Use este ID para consultar o vault via API Key em scripts e automações.
              </p>
              <MockScreen label="/vault/7 — Metadados">
                <div className="space-y-3 max-w-xs">
                  <p className="text-sm font-semibold">Metadados</p>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" /> ID do Vault</p>
                    <p className="font-mono font-bold text-primary text-lg">7</p>
                    <p className="text-xs text-muted-foreground">Use em <code className="bg-muted px-1 rounded font-mono">/api/vault/byID/7</code></p>
                  </div>
                  <div className="space-y-1 border-t border-border pt-2">
                    <p className="text-xs text-muted-foreground">Criado por</p>
                    <p className="text-sm font-medium">joao.silva</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Acesso por VM (API)</p>
                    <Badge variant="outline" className="text-[10px]">2 host(s)</Badge>
                  </div>
                </div>
              </MockScreen>
              <InfoBox title="Como usar o ID na API" color="blue">
                Com o ID em mãos, sua VM pode consultar os valores via:{" "}
                <code className="font-mono text-xs">GET /api/vault/byID/7</code> (por ID) ou{" "}
                <code className="font-mono text-xs">GET /api/vault/byName/BD-Producao</code> (por nome).
                Consulte a <Link href="/api-manual" className="underline">Documentação da API</Link> para exemplos completos.
              </InfoBox>
            </SubSection>

            <SubSection title="6.2 Visualizando uma Credencial">
              <InfoBox title="Proteção de valores no browser" color="amber">
                Para itens do tipo <strong>Credencial</strong>, os valores <em>nunca</em> são exibidos no browser, independentemente do papel do usuário. A mensagem <code className="font-mono text-xs">••••••••••••• [Acesse via API para visualizar]</code> é sempre exibida no lugar do valor real.
              </InfoBox>

              <MockScreen label="/vault/7 — BD-Producao (Credencial)">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" />
                    <span className="font-bold">BD-Producao</span>
                    <Badge>Credencial</Badge>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-xs text-amber-700 dark:text-amber-400">
                    ⚠ <strong>Valores protegidos no browser</strong> — Para visualizar os valores reais, utilize a API Key com o IP desta VM autorizado.
                  </div>
                  {[{ key: "DB_HOST" }, { key: "DB_PASSWORD" }, { key: "DB_PORT" }].map((e) => (
                    <div key={e.key} className="border border-border rounded-lg p-3 space-y-2 bg-muted/10">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-mono font-medium">{e.key}</span>
                        <Badge variant="outline" className="text-[10px] gap-1"><Lock className="h-2.5 w-2.5" /> Somente via API</Badge>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground italic p-2 bg-background rounded border border-border">
                        ••••••••••••••• [Acesse via API para visualizar]
                      </div>
                    </div>
                  ))}
                </div>
              </MockScreen>
            </SubSection>

            <SubSection title="6.3 Editando um Vault">
              <div className="space-y-2">
                <Step n={1}>Clique no botão <strong>"Editar"</strong> no canto superior direito.</Step>
                <Step n={2}>O <strong>nome</strong> do item fica editável diretamente no cabeçalho.</Step>
                <Step n={3}>Os cards de edição aparecem abaixo: <strong>Entradas</strong>, <strong>Informações Básicas</strong> (categoria, descrição), <strong>Controle de Acesso por Usuário</strong> e <strong>Restrição por VM/Host</strong>.</Step>
                <Step n={4}>Para <strong>credenciais</strong>: o campo de valor fica vazio. Digite um novo valor para alterá-lo, ou deixe vazio para manter o valor atual criptografado.</Step>
                <Step n={5}>Para <strong>variáveis globais</strong>: o campo de valor fica preenchido com o valor atual e pode ser editado normalmente.</Step>
                <Step n={6}>Clique em <strong>"Salvar Alterações"</strong> para confirmar.</Step>
              </div>
            </SubSection>

            <SubSection title="6.4 Excluindo um Vault">
              <div className="space-y-2">
                <Step n={1}>Clique no botão vermelho <strong>"Excluir"</strong>.</Step>
                <Step n={2}>Um diálogo de confirmação é exibido. Esta ação é irreversível.</Step>
                <Step n={3}>Clique em <strong>"Sim, excluir"</strong> para confirmar a exclusão permanente.</Step>
              </div>
            </SubSection>
          </Section>

          {/* 7. Usuários */}
          <Section id="usuarios" title="7. Gestão de Usuários (Admin)">
            <p className="text-muted-foreground">Disponível apenas para administradores. Acesse pelo menu lateral <strong>"Usuários"</strong>.</p>

            <MockScreen label="/users">
              <div className="space-y-2">
                <p className="font-bold">Usuários</p>
                <div className="space-y-2">
                  {[
                    { name: "joao.silva", role: "Admin", active: true, reset: false },
                    { name: "maria.ops", role: "Usuário", active: true, reset: false },
                    { name: "carlos.dev", role: "Usuário", active: false, reset: true },
                  ].map((u) => (
                    <div key={u.name} className="border border-border rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <div className="flex gap-1.5">
                            <Badge variant={u.role === "Admin" ? "default" : "secondary"} className="text-[10px]">{u.role}</Badge>
                            {!u.active && <Badge variant="destructive" className="text-[10px]">Desativado</Badge>}
                            {u.reset && <Badge variant="outline" className="text-[10px]">Reset Pendente</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="text-xs border border-border px-2 py-1 rounded text-muted-foreground cursor-pointer hover:bg-destructive/10">Resetar Senha</div>
                        <div className={`text-xs border px-2 py-1 rounded cursor-pointer ${u.active ? "border-green-500/50 text-green-600" : "border-muted text-muted-foreground"}`}>
                          {u.active ? "Ativo" : "Inativo"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </MockScreen>

            <div className="space-y-3 mt-4">
              <SubSection title="Resetar senha de um usuário">
                <div className="space-y-2">
                  <Step n={1}>Localize o usuário na lista.</Step>
                  <Step n={2}>Clique em <strong>"Resetar Senha"</strong>.</Step>
                  <Step n={3}>O usuário receberá a flag de "Reset Pendente". Na próxima vez que digitar o usuário na tela de login, o sistema exibirá o diálogo para definir nova senha.</Step>
                </div>
              </SubSection>

              <SubSection title="Ativar/Desativar um usuário">
                <div className="space-y-2">
                  <Step n={1}>Clique no toggle <strong>"Ativo/Inativo"</strong> na linha do usuário.</Step>
                  <Step n={2}>Usuários desativados não podem fazer login até que um administrador os reative.</Step>
                </div>
                <InfoBox title="Proteção de último admin" color="amber">
                  O sistema impede a desativação do último administrador ativo, evitando perda de acesso ao sistema.
                </InfoBox>
              </SubSection>
            </div>
          </Section>

          {/* 8. Configurações */}
          <Section id="configuracoes" title="8. Configurações (Admin)">
            <p className="text-muted-foreground">Disponível apenas para administradores. Acesse pelo menu lateral <strong>"Configurações"</strong>.</p>

            <MockScreen label="/settings">
              <div className="space-y-3">
                <p className="font-bold">Configurações</p>
                <div className="border border-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Exibir credenciais de demonstração</p>
                    <p className="text-xs text-muted-foreground">Mostra/oculta o card de demo na tela de login</p>
                  </div>
                  <div className="w-10 h-5 bg-primary rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                  </div>
                </div>
              </div>
            </MockScreen>

            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside mt-3">
              <li>O toggle <strong>"Exibir credenciais de demonstração"</strong> controla se o card de demo aparece na tela de login.</li>
              <li>Desative em produção para não expor usuários e senhas de demo.</li>
            </ul>
          </Section>

          {/* 9. Perfil */}
          <Section id="perfil" title="9. Perfil, 2FA e API Keys">
            <p className="text-muted-foreground">Acesse seu perfil pelo menu lateral <strong>"Perfil"</strong>. Permite alterar a senha, configurar o 2FA e gerenciar suas API Keys para integração com scripts e VMs.</p>

            <SubSection title="9.1 Alterar senha">
              <div className="space-y-2">
                <Step n={1}>Na aba <strong>"Senha"</strong>, informe a senha atual.</Step>
                <Step n={2}>Digite a nova senha (mínimo 12 caracteres, maiúscula, minúscula, número e especial).</Step>
                <Step n={3}>Confirme e clique em <strong>"Alterar Senha"</strong>.</Step>
              </div>
            </SubSection>

            <SubSection title="9.2 Configurar 2FA">
              <div className="space-y-2">
                <Step n={1}>Acesse a aba <strong>"Autenticação 2FA"</strong>.</Step>
                <Step n={2}>Clique em <strong>"Configurar 2FA"</strong>. Um QR code será exibido.</Step>
                <Step n={3}>Abra seu app autenticador (Google Authenticator, Authy) e escaneie o QR code.</Step>
                <Step n={4}>Digite o código de 6 dígitos gerado pelo app e clique em <strong>"Confirmar Ativação"</strong>.</Step>
                <Step n={5}>Para desativar: clique em <strong>"Desativar 2FA"</strong>, confirme com um código OTP válido.</Step>
              </div>
            </SubSection>

            <SubSection title="9.3 Gerenciar API Keys">
              <p className="text-sm text-muted-foreground mb-3">
                API Keys permitem que scripts, VMs e serviços consultem o vault programaticamente,
                sem usar suas credenciais de login. São a <strong>única forma</strong> de obter valores
                reais de itens do tipo Credencial fora do browser.
              </p>

              <MockScreen label="/profile — aba API Keys">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">API Keys</p>
                    <div className="bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-md font-medium">+ Gerar Nova</div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "vm-producao-app1", prefix: "vgk_a1b2c3", active: true, last: "há 2 min" },
                      { name: "pipeline-ci",      prefix: "vgk_d4e5f6", active: true, last: "há 3 dias" },
                      { name: "vm-staging-old",   prefix: "vgk_g7h8i9", active: false, last: "nunca" },
                    ].map((k) => (
                      <div key={k.name} className="border border-border rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{k.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-muted-foreground">{k.prefix}...</span>
                            <Badge variant={k.active ? "outline" : "destructive"} className="text-[10px]">
                              {k.active ? "Ativa" : "Revogada"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">último uso: {k.last}</span>
                          </div>
                        </div>
                        <div className="text-xs text-destructive/70 cursor-pointer hover:text-destructive">🗑 Revogar</div>
                      </div>
                    ))}
                  </div>
                </div>
              </MockScreen>

              <div className="space-y-2 mt-3">
                <p className="text-sm font-semibold">Gerar uma nova API Key:</p>
                <div className="space-y-2">
                  <Step n={1}>Na aba <strong>"API Keys"</strong> do seu perfil, clique em <strong>"Gerar Nova API Key"</strong>.</Step>
                  <Step n={2}>Dê um nome descritivo que identifique o serviço ou VM (ex: <code className="font-mono text-xs bg-muted px-1 rounded">vm-producao-app1</code>).</Step>
                  <Step n={3}><strong>Copie a chave imediatamente.</strong> O valor completo é exibido <strong>uma única vez</strong> e não pode ser recuperado depois.</Step>
                  <Step n={4}>Configure a chave como variável de ambiente na VM (<code className="font-mono text-xs bg-muted px-1 rounded">export VAULTGUARD_API_KEY="vgk_..."</code>).</Step>
                  <Step n={5}>Use o header <code className="font-mono text-xs bg-muted px-1 rounded">X-API-Key: vgk_...</code> nas requisições à API.</Step>
                </div>
              </div>

              <InfoBox title="Uma chave por serviço" color="green">
                Crie uma API Key separada para cada VM ou serviço. Assim, se uma chave for comprometida,
                você pode revogar <strong>apenas ela</strong> sem impactar os demais serviços.
                Para revogar: clique no ícone de lixeira ao lado da chave no Perfil → API Keys.
              </InfoBox>
            </SubSection>
          </Section>

          {/* 10. Logs */}
          <Section id="logs" title="10. Logs de Auditoria">
            <p className="text-muted-foreground">Acesse pelo menu <strong>"Audit Logs"</strong>. Exibe todos os acessos a itens do vault nos últimos 30 dias.</p>

            <MockScreen label="/logs">
              <div className="space-y-2">
                <p className="font-bold">Logs de Auditoria</p>
                <div className="space-y-1.5">
                  {[
                    { user: "joao.silva", item: "BD-Producao", ip: "10.0.1.50", time: "04/05/2026 22:34" },
                    { user: "api_key:vgk_abc", item: "API-Stripe-Prod", ip: "10.0.1.51", time: "04/05/2026 22:10" },
                    { user: "maria.ops", item: "ENV-Backend", ip: "192.168.1.5", time: "04/05/2026 21:58" },
                  ].map((l, i) => (
                    <div key={i} className="border border-border rounded px-3 py-2 text-xs flex flex-wrap gap-x-4 gap-y-0.5">
                      <span className="text-primary font-medium">{l.user}</span>
                      <span className="text-muted-foreground">acessou</span>
                      <span className="font-medium">{l.item}</span>
                      <span className="text-muted-foreground">de {l.ip}</span>
                      <span className="text-muted-foreground ml-auto">{l.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </MockScreen>

            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside mt-3">
              <li>Cada linha mostra: <strong>usuário</strong>, <strong>item acessado</strong>, <strong>IP de origem</strong> e <strong>data/hora</strong>.</li>
              <li>Acessos via API key aparecem como <code className="font-mono text-xs">api_key:vgk_...</code>.</li>
              <li>Use os filtros para buscar por usuário, item ou data.</li>
              <li>Retenção: últimos 30 dias.</li>
            </ul>
          </Section>

          {/* Footer */}
          <div className="border-t border-border pt-8 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>VaultGuard — Manual de Operação</span>
            </div>
            <Link href="/api-manual" className="flex items-center gap-1 hover:text-foreground">
              Documentação da API <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
