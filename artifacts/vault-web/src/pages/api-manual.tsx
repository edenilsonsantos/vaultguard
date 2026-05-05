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
  const authColor = (auth === "API Key" || auth === "API Key + Cert")
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
  { id: "apikey",   label: "3. API Key e Certificado" },
  { id: "headers",  label: "4. Base URL e Headers" },
  { id: "vault",    label: "5. Endpoints de Consulta" },
  { id: "ip",       label: "6. Restrição por IP/Host" },
  { id: "errors",   label: "7. Erros Comuns" },
  { id: "examples", label: "8. Exemplos Práticos" },
  { id: "swagger",  label: "9. Swagger UI" },
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
              de forma segura via API REST com autenticação de <strong>dois fatores: API Key + Certificado</strong>.
            </p>
            <div className="flex flex-wrap gap-3">
              <InfoBox title="" color="blue">
                Todos os exemplos utilizam dados fictícios. Substitua a URL base, API Key, certificado e IDs pelos valores reais do seu ambiente.
              </InfoBox>
              <div className="flex items-center gap-2 text-sm border border-primary/30 bg-primary/5 rounded-md px-4 py-3">
                <Server className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Prefere explorar os endpoints interativamente? Use o{" "}
                  <a href="/api/swagger" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">Swagger UI →</a>
                </span>
              </div>
            </div>
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
              A API utiliza <strong>autenticação de dois fatores</strong> para acesso programático aos vaults:
              uma <strong>API Key</strong> e um <strong>Certificado digital</strong> — ambos devem pertencer ao mesmo usuário.
            </p>

            <div className="border border-primary/30 rounded-lg p-5 space-y-4 bg-primary/5">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">Modo recomendado: API Key + Certificado (dois fatores)</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Envie <strong>ambos</strong> os headers em cada requisição. O servidor valida que a API Key e o Certificado
                pertencem ao mesmo usuário, que o certificado está ativo e não expirou.
              </p>
              <div className="space-y-2">
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Header</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Gerado em</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Formato</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="px-4 py-2 font-mono text-xs text-primary">X-API-Key</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">Perfil → API Keys</td>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">vgk_a1b2c3...</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-xs text-primary">X-Certificate</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">Perfil → Certificados</td>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">aa:bb:cc:dd:... (fingerprint SHA-256)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <CodeBlock lang="bash" code={`curl -s "https://vaultguard.empresa.com.br/api/vault/byID/7" \\
  -H "X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890..." \\
  -H "X-Certificate: 3a:b2:c1:d0:e9:f8:07:16:25:34:43:52:61:70:7f:8e:9d:ac:bb:ca:d9:e8:f7:06:15:24:33:42:51:60:6f:7e"`} />
              </div>
              <InfoBox title="Vantagem: sem restrição por IP" color="green">
                Quando ambos os headers estão presentes, <strong>não há verificação de IP/host</strong>.
                A segurança é garantida pelos dois fatores de autenticação — qualquer máquina com a API Key
                e o fingerprint corretos pode consultar o vault, independentemente do IP.
                Ideal para ambientes com IPs dinâmicos, containers ou pipelines de CI/CD.
              </InfoBox>
            </div>

            <div className="border border-border rounded-lg p-5 space-y-3 bg-muted/20">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">Modo alternativo: somente API Key</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Se apenas o header <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">X-API-Key</code> for enviado (sem <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">X-Certificate</code>),
                o acesso funciona mas fica sujeito à <strong>restrição de IP/host</strong> configurada em cada vault (ver seção 6).
                Use este modo somente em VMs com IP fixo e restrição configurada.
              </p>
            </div>

            <div className="border border-border rounded-lg p-5 space-y-3 bg-muted/20">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">JWT (sessão do browser) — não disponível para automações</p>
              </div>
              <p className="text-sm text-muted-foreground">
                O JWT é gerado automaticamente pelo browser ao fazer login e <strong>não deve ser usado</strong> em scripts ou automações:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                <li>Expira em <strong>24 horas</strong> — scripts deixariam de funcionar sem intervenção manual</li>
                <li>Com JWT, valores de <strong>Credencial</strong> sempre retornam <code className="font-mono text-xs">[PROTEGIDO]</code> — impossível obter os valores reais</li>
              </ul>
            </div>
          </Section>

          {/* 3. API Key e Certificado */}
          <Section id="apikey" title="3. Gerando API Key e Certificado">
            <p className="text-muted-foreground">
              Tanto a API Key quanto o Certificado são criados pelo próprio usuário na interface web (menu <strong>Perfil</strong>).
              Para autenticação de dois fatores, você precisa de <strong>um de cada</strong>.
              Recomenda-se um par (API Key + Certificado) por serviço ou VM para facilitar a revogação seletiva.
            </p>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 border-b border-border px-4 py-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">3.1 — Gerar uma API Key (via browser)</p>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { n: 1, text: <>Faça login no VaultGuard e acesse o menu <strong>Perfil</strong> (ícone de usuário no menu lateral).</> },
                  { n: 2, text: <>Na aba <strong>API Keys</strong>, clique em <strong>"Gerar Nova API Key"</strong>.</> },
                  { n: 3, text: <>Dê um nome descritivo, como <code className="font-mono text-xs bg-muted px-1 rounded">vm-producao-app1</code> ou <code className="font-mono text-xs bg-muted px-1 rounded">pipeline-ci-github</code>.</> },
                  { n: 4, text: <><strong>Copie a chave imediatamente.</strong> O valor bruto é exibido <strong>uma única vez</strong> e não pode ser recuperado depois.</> },
                  { n: 5, text: <>Armazene como variável de ambiente (<code className="font-mono text-xs bg-muted px-1 rounded">VAULTGUARD_API_KEY</code>). Nunca coloque no código-fonte.</> },
                ].map(({ n, text }) => (
                  <div key={n} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{n}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Resposta ao criar uma API Key:</p>
              <CodeBlock lang="json" code={`{
  "id": 3,
  "name": "vm-producao-app1",
  "keyPrefix": "vgk_a1b2c3",
  "rawKey": "vgk_a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
  "createdAt": "2026-05-04T22:00:00Z"
}`} />
              <p className="text-xs text-muted-foreground">O campo <code className="font-mono">rawKey</code> é exibido apenas nesta resposta. O sistema armazena somente o hash SHA-256.</p>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 border-b border-border px-4 py-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">3.2 — Gerar um Certificado de Cliente (via browser)</p>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { n: 1, text: <>No menu lateral, acesse <strong>Perfil</strong> e clique na aba <strong>"Certificados"</strong>.</> },
                  { n: 2, text: <>Clique em <strong>"Gerar Novo Certificado"</strong>.</> },
                  { n: 3, text: <>Dê um nome descritivo (ex: <code className="font-mono text-xs bg-muted px-1 rounded">vm-producao-cert</code>) e escolha a validade em dias (ex: 365 = 1 ano).</> },
                  { n: 4, text: <><strong>Anote o Fingerprint</strong> exibido na resposta — este é o valor que você enviará no header <code className="font-mono text-xs bg-muted px-1 rounded">X-Certificate</code>.</> },
                  { n: 5, text: <>O PEM bundle (certificado + chave privada) é exibido <strong>uma única vez</strong>. Salve-o se precisar do certificado completo para outros fins.</> },
                ].map(({ n, text }) => (
                  <div key={n} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{n}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Resposta ao gerar um certificado:</p>
              <CodeBlock lang="json" code={`{
  "id": 1,
  "name": "vm-producao-cert",
  "fingerprint": "3a:b2:c1:d0:e9:f8:07:16:25:34:43:52:61:70:7f:8e:9d:ac:bb:ca:d9:e8:f7:06:15:24:33:42:51:60:6f:7e",
  "isActive": true,
  "expiresAt": "2027-05-04T00:00:00Z",
  "createdAt": "2026-05-04T10:00:00Z",
  "pemBundle": "-----BEGIN CERTIFICATE-----\\nMIID...\\n-----END CERTIFICATE-----\\n\\n-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----"
}`} />
              <p className="text-xs text-muted-foreground">
                Use o valor de <code className="font-mono">fingerprint</code> no header <code className="font-mono">X-Certificate</code> das requisições.
                O <code className="font-mono">pemBundle</code> é exibido apenas uma vez.
              </p>
            </div>

            <InfoBox title="Um par por serviço" color="amber">
              Crie uma API Key + um Certificado para cada VM ou serviço. Se um dos dois for comprometido,
              revogue apenas aquele par sem impactar os outros serviços.
              Para revogar: acesse Perfil → aba correspondente → ícone de lixeira.
            </InfoBox>
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
                <p className="text-sm font-semibold mb-2">Headers para consulta de vault (dois fatores — recomendado)</p>
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
                        ["X-API-Key", "vgk_sua_chave_aqui", "Sim — API Key gerada no Perfil"],
                        ["X-Certificate", "aa:bb:cc:dd:... (fingerprint)", "Sim (modo dois fatores) — elimina restrição de IP"],
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
                <p className="text-sm font-semibold mb-2">Requisição com dois fatores (API Key + Certificado)</p>
                <CodeBlock lang="bash" code={`curl -s "${BASE}/api/vault/byID/7" \\
  -H "X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890..." \\
  -H "X-Certificate: 3a:b2:c1:d0:e9:f8:07:16:25:34:43:52:61:70:7f:8e:9d:ac:bb:ca:d9:e8:f7:06:15:24:33:42:51:60:6f:7e"`} />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Requisição com API Key apenas (sujeita a restrição de IP)</p>
                <CodeBlock lang="bash" code={`curl -s "${BASE}/api/vault/byID/7" \\
  -H "X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890..."`} />
              </div>
            </div>
          </Section>

          {/* 5. Endpoints de Vault */}
          <Section id="vault" title="5. Endpoints de Consulta">
            <p className="text-muted-foreground">
              Os endpoints de <strong>leitura</strong> de vault aceitam API Key + Certificado (dois fatores, sem restrição de IP)
              ou API Key sozinha (sujeito a restrição de IP). Operações de escrita são exclusivamente via interface web.
            </p>

            <Endpoint
              method="GET"
              path="/api/vault/byID/{id}"
              auth="API Key + Cert"
              desc="Busca um vault pelo seu ID numérico. Retorna todos os detalhes e entradas. Para itens do tipo Credencial, retorna os valores reais."
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Hash className="h-3.5 w-3.5 text-primary" />
                <span>O ID do vault está visível na página de detalhes, no card "Metadados" (coluna direita).</span>
              </div>
              <CodeBlock lang="bash" code={`curl -s "${BASE}/api/vault/byID/7" \\
  -H "X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890..." \\
  -H "X-Certificate: 3a:b2:c1:d0:e9:f8:07:16:25:34:43:52:61:70:7f:8e:9d:ac:bb:ca:d9:e8:f7:06:15:24:33:42:51:60:6f:7e"`} />
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
              auth="API Key + Cert"
              desc="Busca um vault pelo nome (insensível a maiúsculas/minúsculas). Útil quando o nome é mais fácil de referenciar do que o ID. Encode o nome na URL se houver espaços ou caracteres especiais."
            >
              <CodeBlock lang="bash" code={`# Nome simples (sem espaços):
curl -s "${BASE}/api/vault/byName/BD-Producao" \\
  -H "X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890..." \\
  -H "X-Certificate: 3a:b2:c1:d0:e9:f8:07:..."

# Nome com espaços (URL-encoded):
curl -s "${BASE}/api/vault/byName/BD%20Produ%C3%A7%C3%A3o" \\
  -H "X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890..." \\
  -H "X-Certificate: 3a:b2:c1:d0:e9:f8:07:..."

# Python com requests (encode automático):
import requests
resp = requests.get(
    f"${BASE}/api/vault/byName/BD-Producao",
    headers={
        "X-API-Key": API_KEY,
        "X-Certificate": CERT_FINGERPRINT,
    }
)`} />
              <InfoBox title="Comportamento em nomes duplicados" color="amber">
                Se existirem dois vaults com o mesmo nome, o endpoint retorna o primeiro encontrado.
                Para garantir precisão, prefira usar <strong>/byID/{"{id}"}</strong> em automações críticas.
              </InfoBox>
            </Endpoint>

            <Endpoint
              method="GET"
              path="/api/vault/{id}"
              auth="API Key + Cert"
              desc="Alias equivalente a /byID/{id}. Incluso para compatibilidade. Prefira /byID/{id} para deixar o código mais explícito."
            >
              <CodeBlock lang="bash" code={`curl -s "${BASE}/api/vault/7" \\
  -H "X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890..." \\
  -H "X-Certificate: 3a:b2:c1:d0:e9:f8:07:..."`} />
            </Endpoint>

            <InfoBox title="Operações de escrita — somente via browser" color="blue">
              Criar (<code className="font-mono text-xs">POST /vault</code>), editar (<code className="font-mono text-xs">PATCH /vault/:id</code>) e excluir (<code className="font-mono text-xs">DELETE /vault/:id</code>) um vault
              requerem sessão autenticada pelo browser. Estas operações não aceitam API Key.
            </InfoBox>
          </Section>

          {/* 6. Restrição por IP */}
          <Section id="ip" title="6. Restrição por IP/Host">
            <p className="text-muted-foreground">
              Cada vault pode ser configurado para aceitar consultas de API somente de IPs ou hostnames específicos.
              Esta restrição <strong>se aplica apenas ao modo API Key sozinha</strong>.
              Ao usar <strong>API Key + Certificado</strong>, a verificação de IP é automaticamente ignorada.
            </p>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Modo de auth</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Restrição de IP</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Ideal para</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-mono text-xs text-primary">API Key + Certificado</td>
                    <td className="px-4 py-3 text-xs text-green-600 dark:text-green-400 font-medium">Nenhuma — ignorada</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">Containers, CI/CD, IPs dinâmicos</td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-mono text-xs text-primary">API Key sozinha</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">Aplicada conforme <code className="font-mono">allowedHostsMode</code> do vault</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">VMs com IP fixo e configuração de hosts</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">allowedHostsMode</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Comportamento (API Key sozinha)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-mono text-xs text-primary">"all"</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">Qualquer máquina com API Key válida pode consultar. Sem restrição de IP.</td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-mono text-xs text-primary">"specific"</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">Somente IPs listados em <code className="font-mono">allowedHosts</code>. Outros recebem <code className="font-mono">403 Forbidden</code>.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Resposta quando o IP não é permitido (modo API Key sozinha):</p>
              <CodeBlock lang="json" code={`HTTP/1.1 403 Forbidden

{
  "error": "Acesso via API não permitido para este host",
  "clientIp": "192.168.99.1",
  "allowedHostsMode": "specific"
}`} />
            </div>

            <InfoBox title="Como configurar a restrição de IP" color="green">
              Acesse o vault no browser → clique em <strong>Editar</strong> → seção <strong>"Restrição de Acesso via API por VM/Host"</strong>.
              Selecione "Hosts Específicos" e adicione os IPs das VMs autorizadas. A configuração entra em vigor imediatamente.
              Se você usa API Key + Certificado, esta configuração não tem efeito.
            </InfoBox>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Dica: descobrir o IP da sua VM</p>
              <CodeBlock lang="bash" code={`# Na VM, descobrir o IP que o servidor enxerga (modo API Key só):
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
                    ["401 (key ausente)", "Unauthorized", "Headers X-API-Key e/ou X-Certificate ausentes. Certifique-se de enviar ambos os headers na requisição."],
                    ["401 (key inválida)", "Unauthorized", "API Key inválida, revogada ou inexistente. Verifique se o valor em X-API-Key está correto e se a chave está ativa em Perfil → API Keys."],
                    ["401 (cert inválido)", "Unauthorized", "Certificado inválido, revogado ou não encontrado. Verifique se o fingerprint em X-Certificate corresponde a um certificado ativo em Perfil → Certificados."],
                    ["401 (cert expirado)", "Unauthorized", "O certificado identificado pelo fingerprint está expirado. Gere um novo certificado em Perfil → Certificados."],
                    ["401 (mismatch)", "Unauthorized", "A API Key e o Certificado pertencem a usuários diferentes. Use um par (API Key + Certificado) criado pelo mesmo usuário."],
                    ["403 (acesso)", "Forbidden", "O usuário dono da API Key não tem permissão para este vault. Verifique o controle de acesso por usuário configurado no vault."],
                    ["403 (IP)", "Forbidden", "Modo API Key sozinha: IP da máquina não está em allowedHosts. Adicione o IP no vault, ou use API Key + Certificado (sem restrição de IP)."],
                    ["404", "Not Found", "Vault com esse ID ou nome não existe, ou foi excluído."],
                    ["400", "Bad Request", "Parâmetro inválido (ex: ID não numérico). Verifique a URL."],
                    ["204", "No Content", "DELETE bem-sucedido (sem corpo de resposta)."],
                  ].map(([code, meaning, cause]) => (
                    <tr key={code} className="hover:bg-muted/10">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-primary whitespace-nowrap">{code}</td>
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
                <li>Os headers <code className="font-mono text-xs">X-API-Key</code> e <code className="font-mono text-xs">X-Certificate</code> estão presentes na requisição?</li>
                <li>A API Key está ativa em Perfil → API Keys?</li>
                <li>O Certificado está ativo e não expirado em Perfil → Certificados?</li>
                <li>A API Key e o Certificado foram criados pelo mesmo usuário?</li>
                <li>O usuário dono da chave tem acesso ao vault?</li>
                <li>Se usando apenas API Key (sem cert) e <code className="font-mono text-xs">allowedHostsMode: "specific"</code>, o IP da VM está na lista?</li>
                <li>O ID ou nome do vault está correto?</li>
              </ol>
            </InfoBox>
          </Section>

          {/* 8. Exemplos Práticos */}
          <Section id="examples" title="8. Exemplos Práticos">

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Python — inicialização de aplicação (dois fatores)</h3>
              <p className="text-sm text-muted-foreground">
                Carrega as entradas de um vault na inicialização usando API Key + Certificado. Funciona de qualquer IP.
              </p>
              <CodeBlock lang="python" code={`import os
import requests

VAULT_BASE    = "https://vaultguard.empresa.com.br/api"
API_KEY       = os.environ["VAULTGUARD_API_KEY"]       # nunca coloque no código!
CERT_FP       = os.environ["VAULTGUARD_CERT_FP"]       # fingerprint do certificado
VAULT_ID      = 7  # ID visível em Vault → Metadados

def get_vault_entries(vault_id: int) -> dict:
    resp = requests.get(
        f"{VAULT_BASE}/vault/byID/{vault_id}",
        headers={
            "X-API-Key":    API_KEY,
            "X-Certificate": CERT_FP,
        },
        timeout=5,
    )
    resp.raise_for_status()
    data = resp.json()
    return {e["key"]: e["value"] for e in data["entries"]}

entries     = get_vault_entries(VAULT_ID)
db_host     = entries["DB_HOST"]
db_password = entries["DB_PASSWORD"]
db_port     = int(entries["DB_PORT"])

print(f"Conectando ao banco em {db_host}:{db_port}...")`} />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bash — script de deploy com jq (dois fatores)</h3>
              <p className="text-sm text-muted-foreground">
                Busca as entradas do vault pelo nome usando API Key + Certificado.
              </p>
              <CodeBlock lang="bash" code={`#!/usr/bin/env bash
set -euo pipefail

VAULT_BASE="https://vaultguard.empresa.com.br/api"
API_KEY="$VAULTGUARD_API_KEY"       # exportada como variável de ambiente
CERT_FP="$VAULTGUARD_CERT_FP"       # fingerprint do certificado
VAULT_NAME="BD-Producao"            # nome do vault (ou use byID/7)

# Busca as entradas do vault pelo nome
RESPONSE=$(curl -sf "$VAULT_BASE/vault/byName/$VAULT_NAME" \\
  -H "X-API-Key: $API_KEY" \\
  -H "X-Certificate: $CERT_FP")

# Extrai valores usando jq
DB_HOST=$(echo "$RESPONSE" | jq -r '.entries[] | select(.key=="DB_HOST") | .value')
DB_PASS=$(echo "$RESPONSE" | jq -r '.entries[] | select(.key=="DB_PASSWORD") | .value')
DB_PORT=$(echo "$RESPONSE" | jq -r '.entries[] | select(.key=="DB_PORT") | .value')

echo "Conectando a $DB_HOST:$DB_PORT..."
# ... usar as credenciais para migrations, seeds, etc.`} />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Node.js — carregamento no boot (dois fatores)</h3>
              <p className="text-sm text-muted-foreground">
                Carrega as entradas do vault e injeta no <code className="font-mono text-xs bg-muted px-1 rounded">process.env</code> antes do app principal iniciar.
              </p>
              <CodeBlock lang="javascript" code={`// vault-init.js — execute ANTES do app principal
const API_KEY   = process.env.VAULTGUARD_API_KEY;
const CERT_FP   = process.env.VAULTGUARD_CERT_FP;
const VAULT_ID  = process.env.VAULTGUARD_VAULT_ID;  // ex: "7"
const VAULT_URL = \`https://vaultguard.empresa.com.br/api/vault/byID/\${VAULT_ID}\`;

async function loadVaultEnv() {
  const res = await fetch(VAULT_URL, {
    headers: {
      "X-API-Key":     API_KEY,
      "X-Certificate": CERT_FP,
    },
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

// Uso no ponto de entrada (ex: server.js):
// const { loadVaultEnv } = require("./vault-init");
// await loadVaultEnv();
// ... iniciar o servidor`} />
            </div>

            <InfoBox title="Boas práticas de segurança" color="green">
              <ul className="space-y-1.5 list-disc list-inside text-sm">
                <li>Nunca coloque a API Key ou o fingerprint no código-fonte. Use variáveis de ambiente (<code className="font-mono text-xs">VAULTGUARD_API_KEY</code>, <code className="font-mono text-xs">VAULTGUARD_CERT_FP</code>).</li>
                <li>Use sempre <strong>API Key + Certificado</strong> — sem restrição de IP e com dois fatores de segurança.</li>
                <li>Crie um par (API Key + Certificado) por VM/serviço — facilita revogação seletiva.</li>
                <li>Rotacione periodicamente: revogar a API Key antiga + gerar nova; renovar o Certificado antes de expirar.</li>
                <li>Monitore os logs de auditoria regularmente para detectar acessos inesperados.</li>
                <li>Prefira <code className="font-mono text-xs">/byID/{"{id}"}</code> em automações críticas para evitar ambiguidade de nomes.</li>
              </ul>
            </InfoBox>
          </Section>

          {/* 9. Swagger UI */}
          <Section id="swagger" title="9. Swagger UI — Exploração Interativa">
            <p className="text-muted-foreground">
              O VaultGuard disponibiliza uma interface Swagger UI em{" "}
              <a href="/api/swagger" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">/api/swagger</a>{" "}
              para explorar e testar todos os endpoints interativamente, sem precisar escrever código.
            </p>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 border-b border-border px-4 py-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Como usar o Swagger UI para testar a API</p>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { n: 1, text: <>Acesse <a href="/api/swagger" target="_blank" rel="noopener noreferrer" className="text-primary font-mono text-xs hover:underline">/api/swagger</a> — a página é <strong>pública</strong>, não requer login.</> },
                  { n: 2, text: <>Clique em <strong>"Authorize"</strong> (botão no topo direito).</> },
                  { n: 3, text: <>Preencha o campo <strong>"ApiKeyAuth"</strong> com sua API Key (<code className="font-mono text-xs bg-muted px-1 rounded">vgk_...</code>).</> },
                  { n: 4, text: <>Preencha o campo <strong>"CertificateAuth"</strong> com o fingerprint do seu certificado (<code className="font-mono text-xs bg-muted px-1 rounded">3a:b2:c1:...</code>).</> },
                  { n: 5, text: <>Clique em <strong>"Authorize"</strong> e feche o diálogo. As credenciais ficam salvas na sessão do browser.</> },
                  { n: 6, text: <>Expanda um endpoint (ex: <code className="font-mono text-xs bg-muted px-1 rounded">GET /vault/byID/{"{id}"}</code>), clique em <strong>"Try it out"</strong>, preencha o ID e clique em <strong>"Execute"</strong>.</> },
                ].map(({ n, text }) => (
                  <div key={n} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{n}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-semibold">Disponível publicamente</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  A interface Swagger é acessível sem login. Qualquer pessoa com acesso ao sistema pode visualizar a documentação dos endpoints.
                  Para <em>executar</em> requisições de vault, é necessário ter uma API Key + Certificado válidos.
                </p>
              </div>
              <div className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Autenticação persistente</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  As credenciais inseridas no Swagger UI ficam salvas na sessão do browser (<code className="font-mono text-xs">localStorage</code>).
                  Não é necessário reautenticar a cada requisição na mesma sessão.
                  Limpe ao usar em computadores compartilhados.
                </p>
              </div>
            </div>

            <InfoBox title="Endpoints somente via browser" color="amber">
              Operações de escrita (criar, editar, excluir vault) e gerenciamento (API Keys, Certificados, Usuários)
              requerem sessão JWT do browser e aparecem como <strong>"Browser/JWT"</strong> no Swagger.
              Eles são documentados para referência, mas não podem ser executados via Swagger UI.
            </InfoBox>

            <div className="flex justify-center pt-2">
              <a
                href="/api/swagger"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Server className="h-4 w-4" />
                Abrir Swagger UI →
              </a>
            </div>
          </Section>

          {/* Footer */}
          <div className="border-t border-border pt-8 flex items-center justify-between text-sm text-muted-foreground flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>VaultGuard — Documentação da API</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/manual" className="flex items-center gap-1 hover:text-foreground">
                <BookOpen className="h-4 w-4" /> Manual de Operação
              </Link>
              <a href="/api/swagger" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
                <Server className="h-4 w-4" /> Swagger UI →
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
