import { Link } from "wouter";
import { Shield, Code2, BookOpen, Key, Lock, Server, Copy, Check, AlertTriangle, Hash, CheckCircle2, XCircle, Info } from "lucide-react";
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

function EndpointHeader({ method, path }: { method: string; path: string }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  };
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border border-border rounded-lg">
      <span className={`text-xs font-bold font-mono border px-2 py-0.5 rounded ${colors[method] ?? ""}`}>{method}</span>
      <code className="text-sm font-mono text-foreground">{path}</code>
      <Badge variant="outline" className="ml-auto text-[10px] border bg-primary/10 text-primary border-primary/30">API Key + Certificado</Badge>
    </div>
  );
}

const BASE = "https://vaultguard.empresa.com.br";
const FAKE_KEY = "vgk_a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef123456789";
const FAKE_FP  = "c3:9b:f6:f9:20:1f:31:f7:24:5d:1f:da:c6:3a:b2:11:e9:f8:07:16:25:34:43:52:61:70:7f:8e:9d:ac:bb:ca";

const toc = [
  { id: "regras",      label: "1. Regras de Acesso" },
  { id: "apikey",      label: "2. Obtendo a API Key" },
  { id: "cert",        label: "3. Obtendo o Certificado" },
  { id: "headers",     label: "4. Headers Obrigatórios" },
  { id: "healthz",     label: "5. GET /api/healthz" },
  { id: "byid",        label: "6. GET /api/vault/byID/{id}" },
  { id: "byname",      label: "7. GET /api/vault/byName/{nome}" },
  { id: "exemplos",    label: "8. Exemplos Completos" },
  { id: "erros",       label: "9. Erros Comuns" },
];

export default function ApiManual() {
  return (
    <div className="min-h-screen bg-background text-foreground">
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

        <main className="flex-1 space-y-14 min-w-0">

          {/* Hero */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              <span className="text-sm text-primary font-medium">Referência da API — Acesso Programático</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Consulta de Vault via API</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Esta documentação cobre os <strong>três endpoints disponíveis para acesso programático</strong> ao VaultGuard —
              usados por VMs, scripts e pipelines. Operações de escrita e administração são exclusivas do browser.
            </p>
          </div>

          {/* 1. Regras */}
          <Section id="regras" title="1. Regras de Acesso">
            <p className="text-muted-foreground">
              Para consultar um vault via API, <strong>todos os quatro requisitos abaixo devem ser satisfeitos simultaneamente</strong>.
              A ausência de qualquer um deles resulta em erro 401 ou 403.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  n: "1",
                  title: "Usuário com permissão",
                  desc: "A API Key pertence a um usuário. Esse usuário precisa ter acesso ao vault solicitado (controle de acesso configurado no vault).",
                  icon: <Key className="w-5 h-5 text-primary" />,
                },
                {
                  n: "2",
                  title: "Host autorizado",
                  desc: "Se o vault tiver restrição de IP/Host configurada, o IP da máquina que faz a requisição deve estar na lista de hosts permitidos.",
                  icon: <Server className="w-5 h-5 text-primary" />,
                },
                {
                  n: "3",
                  title: "API Key válida",
                  desc: "Header X-API-Key com uma API Key ativa gerada no perfil do usuário. A chave é validada pelo hash SHA-256 armazenado no servidor.",
                  icon: <Lock className="w-5 h-5 text-primary" />,
                },
                {
                  n: "4",
                  title: "Certificado válido",
                  desc: "Header X-Certificate com o fingerprint de um certificado ativo, não expirado, pertencente ao mesmo usuário da API Key. Obrigatório — não há acesso via API Key sozinha.",
                  icon: <Shield className="w-5 h-5 text-primary" />,
                },
              ].map(({ n, title, desc, icon }) => (
                <div key={n} className="border border-primary/20 rounded-lg p-4 bg-primary/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">{n}</div>
                    {icon}
                    <p className="font-semibold text-sm">{title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed ml-8">{desc}</p>
                </div>
              ))}
            </div>

            <InfoBox title="Restrição de IP é sempre aplicada" color="amber">
              O certificado é um <strong>segundo fator de identidade</strong>, não um bypass de localização.
              Mesmo com API Key + Certificado válidos, se o vault tiver hosts específicos configurados,
              o IP da máquina solicitante deve estar na lista. Não há exceção a esta regra.
            </InfoBox>

            <InfoBox title="Proteção de credenciais no browser" color="blue">
              Itens do tipo <strong>Credencial</strong> retornam os valores reais <em>somente</em> via API Key + Certificado.
              No browser (sessão JWT), os valores são sempre <code className="font-mono">[PROTEGIDO]</code>, independentemente do papel do usuário.
            </InfoBox>
          </Section>

          {/* 2. API Key */}
          <Section id="apikey" title="2. Obtendo a API Key">
            <p className="text-muted-foreground">
              A API Key é gerada pelo próprio usuário na interface web. Cada serviço ou VM deve ter sua própria chave
              para permitir revogação seletiva sem impactar outros sistemas.
            </p>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 border-b border-border px-4 py-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Como gerar uma API Key</p>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { n: 1, text: <>Faça login no VaultGuard e acesse <strong>Perfil</strong> no menu lateral.</> },
                  { n: 2, text: <>Clique na aba <strong>API Keys</strong> e em <strong>"Gerar Nova API Key"</strong>.</> },
                  { n: 3, text: <>Dê um nome descritivo: ex. <code className="font-mono text-xs bg-muted px-1 rounded">vm-producao-app1</code> ou <code className="font-mono text-xs bg-muted px-1 rounded">pipeline-deploy</code>.</> },
                  { n: 4, text: <><strong>Copie a chave imediatamente.</strong> Ela é exibida <strong>uma única vez</strong> e não pode ser recuperada depois. O servidor armazena apenas o hash SHA-256.</> },
                  { n: 5, text: <>Armazene como variável de ambiente (<code className="font-mono text-xs bg-muted px-1 rounded">VAULT_API_KEY</code>). <strong>Nunca</strong> coloque em código-fonte ou repositórios.</> },
                ].map(({ n, text }) => (
                  <div key={n} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{n}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Exemplo de resposta ao criar a API Key:</p>
              <CodeBlock lang="json" code={`{
  "id": 3,
  "name": "vm-producao-app1",
  "keyPrefix": "vgk_a1b2c3",
  "rawKey": "${FAKE_KEY}",
  "createdAt": "2026-05-05T10:00:00Z"
}`} />
              <p className="text-xs text-muted-foreground">
                O valor de <code className="font-mono">rawKey</code> é o que você usa no header <code className="font-mono">X-API-Key</code>.
                Após fechar o diálogo, esse valor não é mais recuperável.
              </p>
            </div>
          </Section>

          {/* 3. Certificado */}
          <Section id="cert" title="3. Obtendo o Certificado e o Fingerprint">
            <p className="text-muted-foreground">
              O certificado é gerado no VaultGuard e serve como segundo fator de autenticação.
              O que você envia no header <strong>não é o texto PEM</strong> — é apenas o <strong>fingerprint</strong>:
              um hash SHA-256 do certificado, em formato hexadecimal separado por dois-pontos.
            </p>

            <div className="border border-amber-500/30 rounded-lg p-5 bg-amber-500/5 space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="font-semibold text-amber-500">O que vai no header X-Certificate</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-400">NÃO envie o texto PEM completo:</p>
                    <CodeBlock lang="text" code={`-----BEGIN CERTIFICATE-----
MIIDxTCCAq2gAwIBAgIJAP...
-----END CERTIFICATE-----

-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----`} />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-400">Envie apenas o fingerprint SHA-256:</p>
                    <CodeBlock lang="text" code={FAKE_FP} />
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 border-b border-border px-4 py-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Como gerar e obter o fingerprint</p>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { n: 1, text: <>No menu lateral, acesse <strong>Perfil</strong> → aba <strong>Certificados</strong>.</> },
                  { n: 2, text: <>Clique em <strong>"Gerar Certificado"</strong>, dê um nome (ex: <code className="font-mono text-xs bg-muted px-1 rounded">vm-producao-cert</code>) e defina a validade em dias.</> },
                  { n: 3, text: <>Após gerar, o certificado aparece na lista com o bloco <strong>"Fingerprint SHA-256"</strong> completo e um <strong>botão de copiar</strong> ao lado.</> },
                  { n: 4, text: <><strong>Copie o fingerprint</strong> usando o botão de copiar — esse é o valor exato para o header <code className="font-mono text-xs bg-muted px-1 rounded">X-Certificate</code>.</> },
                  { n: 5, text: <>O arquivo PEM (com <code className="font-mono text-xs bg-muted px-1 rounded">-----BEGIN CERTIFICATE-----</code>) pode ser baixado pelo botão de download se precisar para outros fins, mas <strong>não é usado nas requisições</strong>.</> },
                ].map(({ n, text }) => (
                  <div key={n} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{n}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Exemplo de resposta ao gerar o certificado:</p>
              <CodeBlock lang="json" code={`{
  "id": 1,
  "name": "vm-producao-cert",
  "fingerprint": "${FAKE_FP}",
  "isActive": true,
  "expiresAt": "2027-05-05T00:00:00Z",
  "createdAt": "2026-05-05T10:00:00Z"
}`} />
              <p className="text-xs text-muted-foreground">
                O campo <code className="font-mono">fingerprint</code> é o valor do header <code className="font-mono">X-Certificate</code>.
                O <code className="font-mono">pemBundle</code> (texto completo do certificado) é exibido apenas uma vez no diálogo e pode ser baixado depois via botão na aba Certificados.
              </p>
            </div>

            <InfoBox title="Um par por serviço" color="green">
              Crie uma <strong>API Key + Certificado</strong> dedicados para cada VM, script ou pipeline.
              Se um dos dois for comprometido, revogue apenas aquele par em <strong>Perfil → aba correspondente → ícone de lixeira</strong>,
              sem impactar outros serviços.
            </InfoBox>
          </Section>

          {/* 4. Headers */}
          <Section id="headers" title="4. Headers Obrigatórios">
            <p className="text-muted-foreground">
              Toda requisição aos endpoints de vault deve incluir os dois headers abaixo.
              Ambos devem pertencer ao <strong>mesmo usuário</strong> que tem acesso ao vault consultado.
            </p>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Header</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Obrigatório</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Valor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Onde obter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-primary">X-API-Key</td>
                    <td className="px-4 py-3 text-xs"><span className="text-green-400 font-semibold">Sim</span></td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">vgk_a1b2c3d4e5...</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">Perfil → aba API Keys → Gerar → copiar rawKey</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-xs text-primary">X-Certificate</td>
                    <td className="px-4 py-3 text-xs"><span className="text-green-400 font-semibold">Sim</span></td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">c3:9b:f6:f9:... (fingerprint SHA-256)</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">Perfil → aba Certificados → botão copiar fingerprint</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Formato de requisição padrão:</p>
              <CodeBlock lang="bash" code={`curl -s "https://SEU-DOMINIO/api/vault/byID/7" \\
  -H "X-API-Key: ${FAKE_KEY}" \\
  -H "X-Certificate: ${FAKE_FP}"`} />
            </div>

            <InfoBox title="" color="amber">
              Enviar <code className="font-mono text-xs">X-API-Key</code> sem <code className="font-mono text-xs">X-Certificate</code> resulta em <strong>erro 401</strong>.
              Ambos os headers são obrigatórios para qualquer acesso programático ao vault.
            </InfoBox>
          </Section>

          {/* 5. healthz */}
          <Section id="healthz" title="5. GET /api/healthz">
            <EndpointHeader method="GET" path="/api/healthz" />
            <p className="text-muted-foreground text-sm">
              Verifica se a API está operacional. Não requer autenticação.
              Use para health checks de infraestrutura, probes de Kubernetes, ou validar conectividade antes de consultar um vault.
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">Requisição:</p>
                <CodeBlock lang="bash" code={`curl -s "${BASE}/api/healthz"`} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Resposta (200 OK):</p>
                <CodeBlock lang="json" code={`{ "status": "ok" }`} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Verificação de conectividade em script:</p>
                <CodeBlock lang="bash" code={`#!/bin/bash
VAULT_URL="https://seu-dominio/api"

# Checar se a API está disponível
STATUS=$(curl -sf "$VAULT_URL/healthz" | grep -o '"ok"' || echo "")
if [ -z "$STATUS" ]; then
  echo "ERRO: VaultGuard API indisponível" >&2
  exit 1
fi
echo "API disponível — iniciando consulta ao vault..."`} />
              </div>
            </div>
          </Section>

          {/* 6. byID */}
          <Section id="byid" title="6. GET /api/vault/byID/{id}">
            <EndpointHeader method="GET" path="/api/vault/byID/{id}" />
            <p className="text-muted-foreground text-sm">
              Consulta um vault pelo seu <strong>ID numérico</strong>. Retorna todos os detalhes e as entradas (chave/valor).
              Para itens do tipo <strong>Credencial</strong>, retorna os valores reais — nunca <code className="font-mono">[PROTEGIDO]</code>.
            </p>

            <div className="border border-border rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Como encontrar o ID do vault</p>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Hash className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>
                  Acesse o vault pelo browser → o ID aparece na URL (<code className="font-mono text-xs bg-muted px-1 rounded">/vault/7</code>)
                  e no card <strong>"Metadados"</strong> na coluna direita da página de detalhes.
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">Requisição (curl):</p>
                <CodeBlock lang="bash" code={`curl -s "${BASE}/api/vault/byID/7" \\
  -H "X-API-Key: ${FAKE_KEY}" \\
  -H "X-Certificate: ${FAKE_FP}"`} />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Resposta de sucesso (200 OK):</p>
                <CodeBlock lang="json" code={`{
  "id": 7,
  "name": "BD-Producao",
  "category": "credencial",
  "description": "Banco de dados PostgreSQL de produção",
  "accessControl": "specific",
  "allowedUserIds": [2, 5],
  "allowedHostsMode": "specific",
  "allowedHosts": ["10.0.1.50", "10.0.1.51"],
  "entries": [
    { "key": "DB_HOST",     "value": "postgres.prod.internal" },
    { "key": "DB_USER",     "value": "app_user" },
    { "key": "DB_PASSWORD", "value": "P@ssw0rd!Prod#2026" },
    { "key": "DB_PORT",     "value": "5432" }
  ],
  "createdByUsername": "joao.silva",
  "createdAt": "2026-04-01T10:00:00Z",
  "updatedAt": "2026-05-04T20:00:00Z"
}`} />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Extraindo um valor específico com jq:</p>
                <CodeBlock lang="bash" code={`# Obter apenas o valor de DB_PASSWORD
DB_PASS=$(curl -s "${BASE}/api/vault/byID/7" \\
  -H "X-API-Key: $VAULT_API_KEY" \\
  -H "X-Certificate: $VAULT_CERT_FP" \\
  | jq -r '.entries[] | select(.key == "DB_PASSWORD") | .value')

echo "Conectando ao banco com senha: $DB_PASS"`} />
              </div>
            </div>

            <InfoBox title="Use byID em automações críticas" color="blue">
              O ID é imutável — mesmo que o vault seja renomeado, o ID não muda.
              Prefira <code className="font-mono text-xs">/byID/</code> em pipelines e scripts de produção para garantir que você está consultando o vault correto.
            </InfoBox>
          </Section>

          {/* 7. byName */}
          <Section id="byname" title="7. GET /api/vault/byName/{nome}">
            <EndpointHeader method="GET" path="/api/vault/byName/{nome}" />
            <p className="text-muted-foreground text-sm">
              Consulta um vault pelo seu <strong>nome</strong> (insensível a maiúsculas/minúsculas).
              Útil quando o nome é mais legível nos scripts do que um ID numérico.
              Encode o nome na URL se houver espaços ou caracteres especiais.
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">Nome simples (sem espaços):</p>
                <CodeBlock lang="bash" code={`curl -s "${BASE}/api/vault/byName/BD-Producao" \\
  -H "X-API-Key: ${FAKE_KEY}" \\
  -H "X-Certificate: ${FAKE_FP}"`} />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Nome com espaços ou acentos (URL-encoded):</p>
                <CodeBlock lang="bash" code={`# "Banco Produção" → encode manual
curl -s "${BASE}/api/vault/byName/Banco%20Produ%C3%A7%C3%A3o" \\
  -H "X-API-Key: ${FAKE_KEY}" \\
  -H "X-Certificate: ${FAKE_FP}"

# Bash com encode automático via printf
NAME="Banco Produção"
ENCODED=$(printf '%s' "$NAME" | jq -sRr @uri)
curl -s "${BASE}/api/vault/byName/$ENCODED" \\
  -H "X-API-Key: $VAULT_API_KEY" \\
  -H "X-Certificate: $VAULT_CERT_FP"`} />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Python (encode automático pela lib requests):</p>
                <CodeBlock lang="python" code={`import requests

resp = requests.get(
    f"${BASE}/api/vault/byName/BD-Producao",
    headers={
        "X-API-Key":     VAULT_API_KEY,
        "X-Certificate": VAULT_CERT_FP,
    },
    timeout=10,
)
resp.raise_for_status()
vault = resp.json()

entries = {e["key"]: e["value"] for e in vault["entries"]}
print(entries["DB_PASSWORD"])`} />
              </div>
            </div>

            <InfoBox title="Nomes duplicados" color="amber">
              Se existirem dois vaults com o mesmo nome, o endpoint retorna o <strong>primeiro encontrado</strong>.
              Para garantir precisão em ambientes com nomes similares, prefira <strong>/byID/{"{id}"}</strong>.
            </InfoBox>
          </Section>

          {/* 8. Exemplos Completos */}
          <Section id="exemplos" title="8. Exemplos Completos">
            <p className="text-muted-foreground">
              Scripts prontos para uso. Substitua as variáveis pelos valores reais do seu ambiente.
            </p>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold mb-2">Bash — script de deploy que injeta credenciais do vault:</p>
                <CodeBlock lang="bash" code={`#!/bin/bash
set -euo pipefail

# ── Configuração ─────────────────────────────────────────────
VAULT_URL="https://seu-dominio/api"
VAULT_API_KEY="vgk_sua_chave_aqui"
VAULT_CERT_FP="c3:9b:f6:f9:..."   # fingerprint copiado do Perfil → Certificados

# ── Health check ─────────────────────────────────────────────
curl -sf "$VAULT_URL/healthz" > /dev/null || { echo "API indisponível" >&2; exit 1; }

# ── Consultar vault ──────────────────────────────────────────
VAULT=$(curl -sf "$VAULT_URL/vault/byName/BD-Producao" \\
  -H "X-API-Key: $VAULT_API_KEY" \\
  -H "X-Certificate: $VAULT_CERT_FP")

# ── Extrair valores com jq ────────────────────────────────────
entry() { echo "$VAULT" | jq -r --arg k "$1" '.entries[] | select(.key==$k) | .value'; }

export DB_HOST=$(entry "DB_HOST")
export DB_USER=$(entry "DB_USER")
export DB_PASS=$(entry "DB_PASSWORD")
export DB_PORT=$(entry "DB_PORT")

echo "Iniciando aplicação com credenciais do vault..."
exec ./minha-aplicacao`} />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Python — cliente reutilizável:</p>
                <CodeBlock lang="python" code={`import os
import requests

VAULT_URL  = os.environ["VAULT_URL"]          # https://seu-dominio/api
API_KEY    = os.environ["VAULT_API_KEY"]       # vgk_...
CERT_FP    = os.environ["VAULT_CERT_FP"]       # c3:9b:f6:...

HEADERS = {
    "X-API-Key":     API_KEY,
    "X-Certificate": CERT_FP,
}

def get_vault_by_id(vault_id: int) -> dict:
    r = requests.get(f"{VAULT_URL}/vault/byID/{vault_id}", headers=HEADERS, timeout=10)
    r.raise_for_status()
    return {e["key"]: e["value"] for e in r.json()["entries"]}

def get_vault_by_name(name: str) -> dict:
    r = requests.get(f"{VAULT_URL}/vault/byName/{name}", headers=HEADERS, timeout=10)
    r.raise_for_status()
    return {e["key"]: e["value"] for e in r.json()["entries"]}

# Uso:
creds = get_vault_by_name("BD-Producao")
print(creds["DB_PASSWORD"])`} />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Node.js (fetch nativo, Node 18+):</p>
                <CodeBlock lang="javascript" code={`const VAULT_URL = process.env.VAULT_URL;      // https://seu-dominio/api
const API_KEY   = process.env.VAULT_API_KEY;   // vgk_...
const CERT_FP   = process.env.VAULT_CERT_FP;   // c3:9b:f6:...

const HEADERS = {
  "X-API-Key":     API_KEY,
  "X-Certificate": CERT_FP,
};

async function getVaultByName(name) {
  const res = await fetch(\`\${VAULT_URL}/vault/byName/\${encodeURIComponent(name)}\`, {
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(\`Vault error \${res.status}: \${await res.text()}\`);
  const { entries } = await res.json();
  return Object.fromEntries(entries.map(e => [e.key, e.value]));
}

// Uso na inicialização da aplicação:
const creds = await getVaultByName("BD-Producao");
console.log(creds.DB_HOST, creds.DB_PORT);`} />
              </div>
            </div>
          </Section>

          {/* 9. Erros */}
          <Section id="erros" title="9. Erros Comuns">
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground w-20">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Mensagem</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Causa e solução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {[
                    ["401", "Certificado obrigatório...", "X-API-Key enviado sem X-Certificate. Ambos são obrigatórios."],
                    ["401", "API key inválida ou inativa", "Chave revogada ou digitada errada. Gere uma nova em Perfil → API Keys."],
                    ["401", "Certificado inválido, revogado ou não encontrado", "Fingerprint errado, certificado revogado, ou pertence a outro usuário. Verifique em Perfil → Certificados."],
                    ["401", "Certificado expirado", "O certificado passou da data de validade. Gere um novo e atualize o fingerprint nas variáveis de ambiente."],
                    ["403", "Acesso negado", "O usuário da API Key não tem permissão para acessar este vault. Verifique o controle de acesso do vault no browser."],
                    ["403", "Acesso via API não permitido para este host", "O IP da máquina não está na lista de hosts permitidos do vault. Adicione o IP em Vault → Editar → Hosts Permitidos."],
                    ["404", "Item não encontrado", "ID ou nome incorreto, ou o vault foi excluído. Confirme pelo browser."],
                    ["401", "Authentication required", "Nenhum header de autenticação enviado. Inclua X-API-Key e X-Certificate."],
                  ].map(([status, msg, cause]) => (
                    <tr key={msg} className="hover:bg-muted/10">
                      <td className="px-4 py-3 font-mono font-bold text-amber-500">{status}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{msg}</td>
                      <td className="px-4 py-3 text-muted-foreground">{cause}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Verificar o IP da sua máquina (para configurar hosts permitidos no vault):</p>
              <CodeBlock lang="bash" code={`# IP público (se a requisição sai para a internet)
curl -s https://api.ipify.org

# IP local da interface de rede
ip route get 1 | awk '{print $7; exit}'

# Ou verificar diretamente na resposta de erro:
# { "error": "...", "clientIp": "10.0.1.50", "allowedHostsMode": "specific" }`} />
            </div>

            <InfoBox title="Dica: teste a conectividade antes do deploy" color="green">
              Sempre teste com <code className="font-mono text-xs">/api/healthz</code> primeiro para confirmar que a URL base está correta,
              depois faça uma consulta real ao vault. Se receber 403 com <code className="font-mono text-xs">clientIp</code> na resposta,
              adicione esse IP na lista de hosts permitidos do vault.
            </InfoBox>
          </Section>

        </main>
      </div>
    </div>
  );
}
