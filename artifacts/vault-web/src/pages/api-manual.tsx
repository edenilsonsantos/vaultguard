import { Link } from "wouter";
import { Shield, Code2, BookOpen, Key, Lock, Server, Copy, Check, AlertTriangle, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  function doCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="relative rounded-md border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">{lang}</span>
        <button onClick={doCopy} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs">
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono overflow-x-auto bg-background leading-relaxed whitespace-pre-wrap break-all">{code}</pre>
    </div>
  );
}

function Endpoint({
  method, path, auth, desc, children,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  auth: string;
  desc: string;
  children?: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    GET: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    POST: "bg-green-500/20 text-green-400 border-green-500/40",
    PATCH: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/40",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/40",
  };
  const authColor = auth === "API Key"
    ? "bg-primary/10 text-primary border-primary/30"
    : "bg-muted text-muted-foreground border-border";
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border flex-wrap">
        <span className={`text-xs font-bold font-mono border px-2 py-0.5 rounded ${colors[method]}`}>{method}</span>
        <code className="text-sm font-mono text-foreground">{path}</code>
        <Badge variant="outline" className={`ml-auto text-[10px] border ${authColor}`}>{auth}</Badge>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">{desc}</p>
        {children}
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-6">
      <h2 className="text-2xl font-bold text-foreground border-b border-border pb-3">{title}</h2>
      {children}
    </section>
  );
}

function InfoBox({ title, children, color = "blue" }: { title: string; children: React.ReactNode; color?: string }) {
  const cls = color === "amber"
    ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
    : color === "green"
      ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
      : color === "red"
        ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
        : "bg-primary/10 border-primary/30 text-primary";
  return (
    <div className={`p-4 rounded-md border ${cls} text-sm`}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div className="opacity-90">{children}</div>
    </div>
  );
}

const BASE = "https://vaultguard.empresa.com.br";

const toc = [
  { id: "intro",    label: "1. Introdução" },
  { id: "auth",     label: "2. Autenticação" },
  { id: "apikey",   label: "3. Gerando uma API Key" },
  { id: "headers",  label: "4. Base URL e Headers" },
  { id: "vault",    label: "5. Endpoints de Consulta" },
  { id: "ip",       label: "6. Restrição por IP/Host" },
  { id: "errors",   label: "7. Erros Comuns" },
  { id: "examples", label: "8. Exemplos Práticos" },
];

export default function ApiManual() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">VaultGuard</span>
            <Badge variant="outline" className="ml-1 text-xs">Documentação da API</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/manual" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> Manual de Operação
            </Link>
            <a href="/api/swagger" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Server className="h-4 w-4" /> Swagger UI
            </a>
            <Link href="/login" className="text-primary hover:underline font-medium">Fazer Login →</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Neste guia</p>
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
              <Code2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-primary font-medium">Referência da API</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Documentação da API VaultGuard</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Integre VMs, scripts e serviços ao VaultGuard para consultar credenciais e variáveis
              de forma segura via API REST autenticada com API Key.
            </p>
            <InfoBox title="" color="blue">
              Todos os exemplos utilizam dados fictícios. Substitua a URL base, API key e IDs pelos valores reais do seu ambiente.
            </InfoBox>
          </div>

          {/* 1. Intro */}
          <Section id="intro" title="1. Introdução">
            <p className="text-muted-foreground">
              A API do VaultGuard permite que sistemas externos consultem o cofre programaticamente,
              sem expor credenciais em código-fonte ou arquivos de configuração. Casos de uso típicos:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
              <li>Scripts de deploy que precisam da senha do banco de dados em tempo de execução</li>
              <li>Aplicações que carregam variáveis de ambiente a partir do vault na inicialização</li>
              <li>Pipelines de CI/CD que injetam segredos de forma dinâmica</li>
              <li>VMs de produção que consultam credenciais sem precisar armazená-las localmente</li>
            </ul>
            <InfoBox title="Proteção de dados" color="green">
              Itens do tipo <strong>Credencial</strong> retornam os valores reais <em>somente</em> via API Key.
              No browser (sessão de usuário), os valores são sempre substituídos por <code className="font-mono">[PROTEGIDO]</code> — independentemente do papel do usuário.
            </InfoBox>
          </Section>

          {/* 2. Auth */}
          <Section id="auth" title="2. Autenticação">
            <p className="text-muted-foreground">
              A API utiliza <strong>exclusivamente API Keys</strong> para autenticação programática.
            </p>

            <div className="border border-primary/30 rounded-lg p-5 space-y-3 bg-primary/5">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">API Key — único método suportado para automações</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Envie o header <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">X-API-Key</code> com sua chave gerada no perfil do sistema.
                A chave é validada por hash SHA-256 — o valor bruto nunca é armazenado.
              </p>
              <CodeBlock lang="http" code={`X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef`} />
              <p className="text-xs text-muted-foreground">
                Cada API Key pertence a um usuário e herda suas permissões de acesso aos vaults.
                Adicionalmente, o vault pode restringir acesso ao IP/host da máquina requisitante (ver seção 6).
              </p>
            </div>

            <div className="border border-border rounded-lg p-5 space-y-3 bg-muted/20">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">JWT (sessão do browser) — não disponível para automações</p>
              </div>
              <p className="text-sm text-muted-foreground">
                O JWT é a autenticação da sessão web, gerada automaticamente pelo browser ao fazer login.
                Ele <strong>não é adequado para integração programática</strong> pelos seguintes motivos:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                <li>Expira em <strong>24 horas</strong> — scripts deixariam de funcionar sem intervenção manual</li>
                <li>Requer armazenar usuário e senha para ser renovado — prática de segurança ruim</li>
                <li>Com JWT, valores de itens <strong>Credencial</strong> sempre retornam <code className="font-mono text-xs">[PROTEGIDO]</code>, tornando-o inútil para automações que precisam dos valores reais</li>
              </ul>
              <InfoBox title="" color="amber">
                Use sempre <strong>API Key</strong> para scripts, VMs e pipelines. O JWT existe apenas para a interface web do sistema.
              </InfoBox>
            </div>
          </Section>

          {/* 3. Gerando API Key */}
          <Section id="apikey" title="3. Gerando uma API Key">
            <p className="text-muted-foreground">
              API Keys são criadas pelo próprio usuário na interface web. Cada usuário pode ter múltiplas chaves —
              recomenda-se <strong>uma chave por serviço ou VM</strong> para facilitar a revogação seletiva.
            </p>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 border-b border-border px-4 py-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Passo a passo — via browser</p>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { n: 1, text: <>Faça login no VaultGuard e acesse o menu <strong>Perfil</strong> (ícone de usuário no menu lateral).</> },
                  { n: 2, text: <>Na aba <strong>API Keys</strong>, clique em <strong>"Gerar Nova API Key"</strong>.</> },
                  { n: 3, text: <>Dê um nome descritivo à chave, como <code className="font-mono text-xs bg-muted px-1 rounded">vm-producao-app1</code> ou <code className="font-mono text-xs bg-muted px-1 rounded">pipeline-ci-github</code>.</> },
                  { n: 4, text: <><strong>Copie a chave imediatamente</strong>. O valor bruto é exibido <strong>uma única vez</strong> e não pode ser recuperado depois.</> },
                  { n: 5, text: <>Armazene a chave como variável de ambiente na VM ou serviço (<code className="font-mono text-xs bg-muted px-1 rounded">VAULTGUARD_API_KEY</code>). Nunca a coloque no código-fonte.</> },
                ].map(({ n, text }) => (
                  <div key={n} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{n}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Formato da chave gerada:</p>
              <CodeBlock lang="json" code={`{
  "id": 3,
  "name": "vm-producao-app1",
  "keyPrefix": "vgk_a1b2c3",
  "rawKey": "vgk_a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
  "createdAt": "2026-05-04T22:00:00Z"
}`} />
            </div>

            <InfoBox title="Segurança da chave" color="amber">
              O sistema armazena apenas o <strong>hash SHA-256</strong> da chave, nunca o valor bruto.
              Se perder a chave, <strong>revogue-a</strong> no perfil e gere uma nova.
              Nunca compartilhe a chave entre serviços diferentes.
            </InfoBox>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Revogar uma API Key (via browser):</p>
              <p className="text-sm text-muted-foreground">
                No Perfil → aba API Keys, clique no ícone de lixeira ao lado da chave que deseja revogar.
                A chave é desativada imediatamente — qualquer requisição com ela retornará <code className="font-mono text-xs bg-muted px-1 rounded">401 Unauthorized</code>.
              </p>
            </div>
          </Section>

          {/* 4. Base URL e Headers */}
          <Section id="headers" title="4. Base URL e Headers">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold mb-2">Base URL</p>
                <CodeBlock lang="text" code={`${BASE}/api`} />
                <p className="text-xs text-muted-foreground mt-2">
                  Substitua <code className="font-mono bg-muted px-1 rounded">vaultguard.empresa.com.br</code> pelo domínio real da sua instalação.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Headers necessários</p>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Header</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Valor</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Obrigatório</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        ["X-API-Key", "vgk_sua_chave_aqui", "Sempre (em todos os endpoints)"],
                        ["Content-Type", "application/json", "Apenas em POST e PATCH"],
                      ].map(([h, v, w]) => (
                        <tr key={h} className="hover:bg-muted/10">
                          <td className="px-4 py-2 font-mono text-xs text-primary">{h}</td>
                          <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{v}</td>
                          <td className="px-4 py-2 text-xs text-muted-foreground">{w}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Exemplo mínimo de requisição autenticada</p>
                <CodeBlock lang="bash" code={`curl -s "${BASE}/api/vault/byID/7" \\
  -H "X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890..."`} />
              </div>
            </div>
          </Section>

          {/* 5. Endpoints de Vault */}
          <Section id="vault" title="5. Endpoints de Consulta">
            <p className="text-muted-foreground">
              Os endpoints de <strong>leitura</strong> de vault suportam API Key. Operações de escrita (criar, editar, excluir) são
              realizadas exclusivamente pela interface web, por usuários autenticados com sessão ativa.
            </p>

            <Endpoint
              method="GET"
              path="/api/vault/byID/{id}"
              auth="API Key"
              desc="Busca um vault pelo seu ID numérico. Retorna todos os detalhes e entradas. Para itens do tipo Credencial, retorna os valores reais (desde que o IP da requisição seja permitido)."
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Hash className="h-3.5 w-3.5 text-primary" />
                <span>O ID do vault está visível na página de detalhes, no card "Metadados" (coluna direita).</span>
              </div>
              <CodeBlock lang="bash" code={`curl -s "${BASE}/api/vault/byID/7" \\
  -H "X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890..."`} />
              <CodeBlock lang="json" code={`{
  "id": 7,
  "name": "BD-Producao",
  "category": "credencial",
  "description": "Banco de dados PostgreSQL de produção",
  "entries": [
    { "key": "DB_HOST",     "value": "postgres.prod.internal" },
    { "key": "DB_PASSWORD", "value": "P@ssw0rd!Prod#2026" },
    { "key": "DB_PORT",     "value": "5432" }
  ],
  "allowedHostsMode": "specific",
  "allowedHosts": ["10.0.1.50", "10.0.1.51"],
  "createdByUsername": "joao.silva",
  "createdAt": "2026-04-01T10:00:00Z",
  "updatedAt": "2026-05-04T20:00:00Z"
}`} />
            </Endpoint>

            <Endpoint
              method="GET"
              path="/api/vault/byName/{nome}"
              auth="API Key"
              desc="Busca um vault pelo nome (insensível a maiúsculas/minúsculas). Útil quando o nome do vault é mais fácil de referenciar do que o ID numérico. Encode o nome na URL se houver espaços ou caracteres especiais."
            >
              <CodeBlock lang="bash" code={`# Nome simples (sem espaços):
curl -s "${BASE}/api/vault/byName/BD-Producao" \\
  -H "X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890..."

# Nome com espaços (URL-encoded):
curl -s "${BASE}/api/vault/byName/BD%20Produ%C3%A7%C3%A3o" \\
  -H "X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890..."

# Python com requests (encode automático):
import requests
resp = requests.get(
    f"${BASE}/api/vault/byName/BD-Producao",
    headers={"X-API-Key": API_KEY}
)`} />
              <InfoBox title="Comportamento em nomes duplicados" color="amber">
                Se existirem dois vaults com o mesmo nome, o endpoint retorna o primeiro encontrado.
                Para garantir precisão, prefira usar <strong>/byID/{"{id}"}</strong> em automações críticas.
              </InfoBox>
            </Endpoint>

            <Endpoint
              method="GET"
              path="/api/vault/{id}"
              auth="API Key"
              desc="Alias equivalente a /byID/{id}. Funciona da mesma forma — incluso para compatibilidade. Prefira /byID/{id} para deixar o código mais explícito."
            >
              <CodeBlock lang="bash" code={`curl -s "${BASE}/api/vault/7" \\
  -H "X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890..."`} />
            </Endpoint>

            <InfoBox title="Operações de escrita — somente via browser" color="blue">
              Criar (<code className="font-mono text-xs">POST /vault</code>), editar (<code className="font-mono text-xs">PATCH /vault/:id</code>) e excluir (<code className="font-mono text-xs">DELETE /vault/:id</code>) um vault
              requerem sessão autenticada pelo browser. Estas operações não aceitam API Key.
            </InfoBox>
          </Section>

          {/* 6. Restrição por IP */}
          <Section id="ip" title="6. Restrição por IP/Host">
            <p className="text-muted-foreground">
              Cada vault pode ser configurado para aceitar consultas via API Key somente de IPs ou hostnames específicos.
              Isso garante que mesmo com uma API Key válida, somente as VMs autorizadas conseguem ler os valores.
            </p>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">allowedHostsMode</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Comportamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-mono text-xs text-primary">"all"</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">Qualquer máquina com API Key válida pode consultar o vault. Sem restrição de IP.</td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-mono text-xs text-primary">"specific"</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">Somente IPs listados em <code className="font-mono">allowedHosts</code> são aceitos. Outros IPs recebem <code className="font-mono">403 Forbidden</code>.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Resposta quando o IP não é permitido:</p>
              <CodeBlock lang="json" code={`HTTP/1.1 403 Forbidden

{
  "error": "Acesso via API não permitido para este host",
  "clientIp": "192.168.99.1",
  "allowedHostsMode": "specific"
}`} />
            </div>

            <InfoBox title="Como configurar" color="green">
              Acesse o vault no browser → clique em <strong>Editar</strong> → seção <strong>"Restrição de Acesso via API por VM/Host"</strong>.
              Selecione "Hosts Específicos" e adicione os IPs das VMs autorizadas. A configuração entra em vigor imediatamente.
            </InfoBox>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Dica: descobrir o IP da sua VM</p>
              <CodeBlock lang="bash" code={`# Na VM, descobrir o IP que o servidor enxerga:
curl -s "${BASE}/api/vault/byID/7" \\
  -H "X-API-Key: vgk_..." | jq '.error, .clientIp'
# Se o IP não for permitido, a resposta inclui o clientIp — use-o para configurar o vault.`} />
            </div>
          </Section>

          {/* 7. Erros */}
          <Section id="errors" title="7. Erros Comuns">
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Significado</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Causa e solução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["401", "Unauthorized", "API Key inválida, revogada ou ausente. Verifique se o header X-API-Key está correto e se a chave está ativa no Perfil."],
                    ["403 (acesso)", "Forbidden", "Usuário dono da API Key não tem permissão para acessar este vault. Verifique o controle de acesso por usuário no vault."],
                    ["403 (IP)", "Forbidden", "IP da máquina não está na lista allowedHosts do vault. Adicione o IP no vault via browser, ou mude allowedHostsMode para 'all'."],
                    ["404", "Not Found", "Vault com esse ID ou nome não existe, ou foi excluído."],
                    ["400", "Bad Request", "Parâmetro inválido (ex: ID não numérico). Verifique a URL."],
                    ["204", "No Content", "DELETE bem-sucedido (sem corpo de resposta)."],
                  ].map(([code, meaning, cause]) => (
                    <tr key={code} className="hover:bg-muted/10">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-primary">{code}</td>
                      <td className="px-4 py-3 text-xs font-semibold whitespace-nowrap">{meaning}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{cause}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Formato padrão de erro:</p>
              <CodeBlock lang="json" code={`{ "error": "Descrição do problema" }`} />
            </div>

            <InfoBox title="Checklist de diagnóstico" color="blue">
              <ol className="space-y-1 list-decimal list-inside text-sm">
                <li>A API Key está presente no header <code className="font-mono text-xs">X-API-Key</code>?</li>
                <li>A chave está ativa no Perfil → API Keys?</li>
                <li>O usuário dono da chave tem acesso ao vault?</li>
                <li>Se <code className="font-mono text-xs">allowedHostsMode: "specific"</code>, o IP da VM está na lista?</li>
                <li>O ID ou nome do vault está correto?</li>
              </ol>
            </InfoBox>
          </Section>

          {/* 8. Exemplos Práticos */}
          <Section id="examples" title="8. Exemplos Práticos">

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Python — inicialização de aplicação</h3>
              <p className="text-sm text-muted-foreground">
                Carrega as entradas de um vault na inicialização da aplicação usando o ID do vault.
              </p>
              <CodeBlock lang="python" code={`import os
import requests

VAULT_BASE = "https://vaultguard.empresa.com.br/api"
API_KEY    = os.environ["VAULTGUARD_API_KEY"]  # nunca coloque a chave no código!
VAULT_ID   = 7  # ID visível no VaultGuard em Vault → Metadados

def get_vault_entries(vault_id: int) -> dict:
    resp = requests.get(
        f"{VAULT_BASE}/vault/byID/{vault_id}",
        headers={"X-API-Key": API_KEY},
        timeout=5,
    )
    resp.raise_for_status()
    data = resp.json()
    return {e["key"]: e["value"] for e in data["entries"]}

entries = get_vault_entries(VAULT_ID)
db_host     = entries["DB_HOST"]
db_password = entries["DB_PASSWORD"]
db_port     = int(entries["DB_PORT"])

print(f"Conectando ao banco em {db_host}:{db_port}...")
# ... conectar ao banco de dados`} />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bash — script de deploy com jq</h3>
              <p className="text-sm text-muted-foreground">
                Busca as entradas do vault pelo nome e injeta as variáveis no ambiente do script.
              </p>
              <CodeBlock lang="bash" code={`#!/usr/bin/env bash
set -euo pipefail

VAULT_BASE="https://vaultguard.empresa.com.br/api"
API_KEY="$VAULTGUARD_API_KEY"   # exportada como variável de ambiente
VAULT_NAME="BD-Producao"        # nome do vault (ou use byID/7)

# Busca as entradas do vault pelo nome
RESPONSE=$(curl -sf "$VAULT_BASE/vault/byName/$VAULT_NAME" \\
  -H "X-API-Key: $API_KEY")

# Extrai valores usando jq
DB_HOST=$(echo "$RESPONSE" | jq -r '.entries[] | select(.key=="DB_HOST") | .value')
DB_PASS=$(echo "$RESPONSE" | jq -r '.entries[] | select(.key=="DB_PASSWORD") | .value')
DB_PORT=$(echo "$RESPONSE" | jq -r '.entries[] | select(.key=="DB_PORT") | .value')

echo "Conectando a $DB_HOST:$DB_PORT..."
# ... usar as credenciais para migrations, seeds, etc.`} />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Node.js — carregamento no boot da aplicação</h3>
              <p className="text-sm text-muted-foreground">
                Carrega as entradas do vault e injeta no <code className="font-mono text-xs bg-muted px-1 rounded">process.env</code> antes do app principal iniciar.
              </p>
              <CodeBlock lang="javascript" code={`// vault-init.js — execute ANTES do app principal
const API_KEY   = process.env.VAULTGUARD_API_KEY;
const VAULT_ID  = process.env.VAULTGUARD_VAULT_ID;  // ex: "7"
const VAULT_URL = \`https://vaultguard.empresa.com.br/api/vault/byID/\${VAULT_ID}\`;

async function loadVaultEnv() {
  const res = await fetch(VAULT_URL, {
    headers: { "X-API-Key": API_KEY },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(\`VaultGuard error \${res.status}: \${body}\`);
  }

  const data = await res.json();
  for (const entry of data.entries) {
    process.env[entry.key] = entry.value;
    console.log(\`✓ Carregado: \${entry.key}\`);
  }
}

module.exports = { loadVaultEnv };

// Uso no ponto de entrada da aplicação (ex: server.js):
// const { loadVaultEnv } = require("./vault-init");
// await loadVaultEnv();
// ... iniciar o servidor`} />
            </div>

            <InfoBox title="Boas práticas de segurança" color="green">
              <ul className="space-y-1.5 list-disc list-inside text-sm">
                <li>Nunca coloque a API Key no código-fonte. Use variáveis de ambiente (<code className="font-mono text-xs">VAULTGUARD_API_KEY</code>).</li>
                <li>Configure <strong>allowedHosts</strong> no vault para restringir o acesso somente às VMs que precisam.</li>
                <li>Crie uma API Key por VM/serviço — facilita a revogação seletiva sem impactar outros serviços.</li>
                <li>Rotacione as API Keys periodicamente (revogar a antiga, gerar uma nova).</li>
                <li>Monitore os logs de auditoria regularmente para detectar acessos inesperados.</li>
                <li>Prefira <code className="font-mono text-xs">/byID/{"{id}"}</code> em automações críticas para evitar ambiguidade de nomes.</li>
              </ul>
            </InfoBox>
          </Section>

          {/* Footer */}
          <div className="border-t border-border pt-8 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>VaultGuard — Documentação da API</span>
            </div>
            <Link href="/manual" className="flex items-center gap-1 hover:text-foreground">
              <BookOpen className="h-4 w-4" /> Manual de Operação
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
