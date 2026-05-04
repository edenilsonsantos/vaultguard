import { Link } from "wouter";
import { Shield, Code2, BookOpen, ChevronRight, Key, Lock, Server, Copy, Check } from "lucide-react";
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
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
        <span className={`text-xs font-bold font-mono border px-2 py-0.5 rounded ${colors[method]}`}>{method}</span>
        <code className="text-sm font-mono text-foreground">{path}</code>
        <Badge variant="outline" className="ml-auto text-[10px]">{auth}</Badge>
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
  { id: "intro", label: "1. Introdução" },
  { id: "auth", label: "2. Autenticação" },
  { id: "apikey", label: "3. Gerando uma API Key" },
  { id: "headers", label: "4. Headers e Base URL" },
  { id: "vault", label: "5. Endpoints de Vault" },
  { id: "errors", label: "6. Erros Comuns" },
  { id: "examples", label: "7. Exemplos Práticos" },
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
              Integre seus serviços e VMs ao VaultGuard para consultar credenciais e variáveis
              de forma segura via API REST autenticada com API key.
            </p>
            <InfoBox title="" color="blue">
              Todos os exemplos utilizam dados fictícios. Substitua a URL base, API key e IDs pelos valores reais do seu ambiente.
            </InfoBox>
          </div>

          {/* 1. Intro */}
          <Section id="intro" title="1. Introdução">
            <p className="text-muted-foreground">
              A API do VaultGuard permite que sistemas externos consultem os dados do cofre programaticamente.
              Casos de uso típicos:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
              <li>Scripts de deploy que precisam da senha do banco de dados</li>
              <li>Aplicações que lêem variáveis de ambiente a partir do vault na inicialização</li>
              <li>Pipelines de CI/CD que injetam segredos de forma dinâmica</li>
              <li>VMs de produção que consultam credenciais sem precisar armazená-las localmente</li>
            </ul>
            <InfoBox title="Proteção de dados" color="green">
              Itens do tipo <strong>Credencial</strong> retornam os valores reais <em>somente</em> via API key.
              No browser (JWT), os valores são substituídos por <code className="font-mono">[PROTEGIDO]</code>.
            </InfoBox>
          </Section>

          {/* 2. Auth */}
          <Section id="auth" title="2. Autenticação">
            <p className="text-muted-foreground">A API aceita dois tipos de autenticação:</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <p className="font-semibold">API Key (recomendado para automações)</p>
                </div>
                <p className="text-sm text-muted-foreground">Passe o header <code className="font-mono text-xs bg-muted px-1 rounded">X-API-Key</code> com a sua API key gerada no sistema.</p>
                <CodeBlock lang="http" code={`X-API-Key: vgk_a1b2c3d4e5f6...`} />
                <p className="text-xs text-muted-foreground">Sujeito à restrição por IP/host se configurado no vault.</p>
              </div>
              <div className="border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-secondary-foreground" />
                  <p className="font-semibold">JWT Bearer (para automações pontuais)</p>
                </div>
                <p className="text-sm text-muted-foreground">Faça login via <code className="font-mono text-xs bg-muted px-1 rounded">POST /api/auth/login</code> e use o token retornado.</p>
                <CodeBlock lang="http" code={`Authorization: Bearer eyJhbGciOiJ...`} />
                <p className="text-xs text-muted-foreground">Com JWT, valores de credenciais retornam <code className="font-mono">[PROTEGIDO]</code>.</p>
              </div>
            </div>
          </Section>

          {/* 3. Gerando API Key */}
          <Section id="apikey" title="3. Gerando uma API Key">
            <p className="text-muted-foreground">
              Cada usuário pode criar múltiplas API keys. Acesse o perfil no browser e vá até a aba <strong>"API Keys"</strong>.
            </p>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Ou via API (requer JWT de um usuário autenticado):</p>
              <CodeBlock lang="bash" code={`curl -X POST ${BASE}/api/apikeys \\
  -H "Authorization: Bearer SEU_JWT_AQUI" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "vm-producao-app1"}'`.replace(/\$\{BASE\}/g, BASE)} />

              <p className="text-sm text-muted-foreground font-semibold mt-2">Resposta:</p>
              <CodeBlock lang="json" code={`{
  "id": 3,
  "name": "vm-producao-app1",
  "keyPrefix": "vgk_a1b2c3",
  "rawKey": "vgk_a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
  "createdAt": "2026-05-04T22:00:00Z"
}`} />
            </div>

            <InfoBox title="Armazene a rawKey com segurança!" color="amber">
              A <code className="font-mono">rawKey</code> é exibida <strong>apenas uma vez</strong>. Armazene-a de forma segura (ex: variável de ambiente na VM). Não é possível recuperá-la depois.
            </InfoBox>
          </Section>

          {/* 4. Headers e Base URL */}
          <Section id="headers" title="4. Headers e Base URL">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">Base URL</p>
                <CodeBlock lang="text" code={`${BASE}/api`} />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Headers obrigatórios</p>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Header</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Valor</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Quando</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        ["X-API-Key", "vgk_sua_chave_aqui", "Acesso via API key (recomendado)"],
                        ["Authorization", "Bearer SEU_JWT", "Acesso via JWT (alternativo)"],
                        ["Content-Type", "application/json", "Requisições POST e PATCH"],
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
            </div>
          </Section>

          {/* 5. Endpoints de Vault */}
          <Section id="vault" title="5. Endpoints de Vault">

            <Endpoint method="GET" path="/api/vault" auth="JWT" desc="Lista todos os itens do vault acessíveis ao usuário autenticado. Valores de credenciais não são retornados (somente contagem de entradas).">
              <CodeBlock lang="bash" code={`curl ${BASE}/api/vault \\
  -H "Authorization: Bearer SEU_JWT"`} />
              <CodeBlock lang="json" code={`[
  {
    "id": 7,
    "name": "BD-Producao",
    "category": "credencial",
    "description": "Banco de dados PostgreSQL de produção",
    "accessControl": "specific",
    "allowedHostsMode": "specific",
    "allowedHosts": ["10.0.1.50", "10.0.1.51"],
    "entryCount": 3,
    "createdBy": 1,
    "createdByUsername": "joao.silva",
    "createdAt": "2026-04-01T10:00:00Z",
    "updatedAt": "2026-05-04T20:00:00Z"
  }
]`} />
            </Endpoint>

            <Endpoint method="GET" path="/api/vault/{id}" auth="API Key ou JWT" desc="Retorna os detalhes completos de um vault, incluindo as entradas chave-valor. Para credenciais, retorna valores reais somente com API key (com IP autorizado).">
              <InfoBox title="Controle de IP" color="amber">
                Se o vault tiver <code className="font-mono">allowedHostsMode: "specific"</code>, somente os IPs listados em <code className="font-mono">allowedHosts</code> podem consultar via API key. Outros IPs recebem <code className="font-mono">403 Forbidden</code>.
              </InfoBox>
              <CodeBlock lang="bash" code={`# Com API key (retorna valores reais de credenciais):
curl ${BASE}/api/vault/7 \\
  -H "X-API-Key: vgk_a1b2c3d4e5f67890abcdef1234567890..."

# Com JWT (valores de credenciais retornam [PROTEGIDO]):
curl ${BASE}/api/vault/7 \\
  -H "Authorization: Bearer SEU_JWT"`} />
              <CodeBlock lang="json" code={`{
  "id": 7,
  "name": "BD-Producao",
  "category": "credencial",
  "description": "Banco de dados PostgreSQL de produção",
  "accessControl": "specific",
  "allowedUserIds": [1, 2],
  "allowedHostsMode": "specific",
  "allowedHosts": ["10.0.1.50", "10.0.1.51"],
  "entries": [
    { "key": "DB_HOST",     "value": "postgres.prod.internal" },
    { "key": "DB_PASSWORD", "value": "P@ssw0rd!Prod#2026" },
    { "key": "DB_PORT",     "value": "5432" }
  ],
  "createdBy": 1,
  "createdByUsername": "joao.silva",
  "createdAt": "2026-04-01T10:00:00Z",
  "updatedAt": "2026-05-04T20:00:00Z"
}`} />
            </Endpoint>

            <Endpoint method="POST" path="/api/vault" auth="JWT" desc="Cria um novo item no vault. Requer autenticação JWT (não API key).">
              <CodeBlock lang="bash" code={`curl -X POST ${BASE}/api/vault \\
  -H "Authorization: Bearer SEU_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "API-Stripe-Prod",
    "category": "credencial",
    "description": "Chaves de API do Stripe para produção",
    "accessControl": "specific",
    "allowedUserIds": [1, 3],
    "allowedHostsMode": "specific",
    "allowedHosts": ["10.0.1.50", "10.0.1.52"],
    "entries": [
      { "key": "STRIPE_SECRET_KEY", "value": "sk_live_XXXXXXXXXXXX" },
      { "key": "STRIPE_WEBHOOK_SECRET", "value": "whsec_YYYYYYYYYY" }
    ]
  }'`} />
            </Endpoint>

            <Endpoint method="PATCH" path="/api/vault/{id}" auth="JWT" desc="Atualiza um item existente. Apenas os campos enviados são alterados. Para entradas de credencial, envie valor vazio para manter o atual.">
              <CodeBlock lang="bash" code={`# Atualizar apenas a descrição e restrição de hosts:
curl -X PATCH ${BASE}/api/vault/7 \\
  -H "Authorization: Bearer SEU_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "BD PostgreSQL prod — versão 16",
    "allowedHostsMode": "specific",
    "allowedHosts": ["10.0.1.50", "10.0.1.51", "10.0.1.55"]
  }'

# Atualizar apenas um valor (deixar vazio mantém o atual):
curl -X PATCH ${BASE}/api/vault/7 \\
  -H "Authorization: Bearer SEU_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{
    "entries": [
      { "key": "DB_HOST",     "value": "" },
      { "key": "DB_PASSWORD", "value": "NovaS3nh@Forte#2026" },
      { "key": "DB_PORT",     "value": "" }
    ]
  }'`} />
              <InfoBox title="Valores vazios preservam o dado anterior" color="green">
                Para credenciais, se o valor de uma entrada for <code className="font-mono">""</code> (string vazia), o sistema mantém o valor criptografado existente. Apenas valores não-vazios são atualizados.
              </InfoBox>
            </Endpoint>

            <Endpoint method="DELETE" path="/api/vault/{id}" auth="JWT" desc="Remove permanentemente um item do vault e todas as suas entradas. Esta ação é irreversível.">
              <CodeBlock lang="bash" code={`curl -X DELETE ${BASE}/api/vault/7 \\
  -H "Authorization: Bearer SEU_JWT"
# Retorna HTTP 204 No Content`} />
            </Endpoint>

            <Endpoint method="GET" path="/api/vault/stats" auth="JWT" desc="Retorna estatísticas gerais do vault.">
              <CodeBlock lang="json" code={`{
  "totalItems": 12,
  "credentialCount": 8,
  "globalVarCount": 4,
  "totalEntries": 47,
  "accessibleToMe": 10
}`} />
            </Endpoint>
          </Section>

          {/* 6. Erros */}
          <Section id="errors" title="6. Erros Comuns">
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Significado</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Causa comum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["401", "Unauthorized", "API key inválida, inativa ou JWT expirado"],
                    ["403", "Forbidden", "IP não autorizado para este vault (allowedHosts), ou usuário sem acesso"],
                    ["404", "Not Found", "Vault com esse ID não existe"],
                    ["400", "Bad Request", "Corpo da requisição inválido (campo obrigatório ausente, tipo errado etc.)"],
                    ["204", "No Content", "DELETE bem-sucedido (sem corpo de resposta)"],
                  ].map(([code, meaning, cause]) => (
                    <tr key={code} className="hover:bg-muted/10">
                      <td className="px-4 py-2 font-mono text-xs font-bold text-primary">{code}</td>
                      <td className="px-4 py-2 text-xs font-semibold">{meaning}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{cause}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">Formato de erro (JSON):</p>
              <CodeBlock lang="json" code={`{
  "error": "Acesso via API não permitido para este host",
  "clientIp": "192.168.99.1",
  "allowedHostsMode": "specific"
}`} />
            </div>
          </Section>

          {/* 7. Exemplos Práticos */}
          <Section id="examples" title="7. Exemplos Práticos">

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Script de inicialização de aplicação (Python)</h3>
              <CodeBlock lang="python" code={`import os
import requests

VAULT_BASE = "https://vaultguard.empresa.com.br/api"
API_KEY    = os.environ["VAULTGUARD_API_KEY"]  # nunca hardcode!
VAULT_ID   = 7  # ID do vault "BD-Producao"

def get_vault_entries(vault_id: int) -> dict:
    resp = requests.get(
        f"{VAULT_BASE}/vault/{vault_id}",
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
              <h3 className="text-lg font-semibold">Script de deploy em shell (Bash)</h3>
              <CodeBlock lang="bash" code={`#!/usr/bin/env bash
set -euo pipefail

VAULT_BASE="https://vaultguard.empresa.com.br/api"
API_KEY="$VAULTGUARD_API_KEY"  # exportada como variável de ambiente
VAULT_ID=7

# Busca todas as entradas do vault
RESPONSE=$(curl -sf "$VAULT_BASE/vault/$VAULT_ID" \\
  -H "X-API-Key: $API_KEY")

# Extrai valores usando jq
DB_HOST=$(echo "$RESPONSE" | jq -r '.entries[] | select(.key=="DB_HOST") | .value')
DB_PASS=$(echo "$RESPONSE" | jq -r '.entries[] | select(.key=="DB_PASSWORD") | .value')
DB_PORT=$(echo "$RESPONSE" | jq -r '.entries[] | select(.key=="DB_PORT") | .value')

echo "Conectando a $DB_HOST:$DB_PORT..."
# ... usar as credenciais para migrations, etc.`} />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Inicializar com .env (Node.js)</h3>
              <CodeBlock lang="javascript" code={`// init-env.js — executar antes do app principal
const { execSync } = require('child_process');

const API_KEY   = process.env.VAULTGUARD_API_KEY;
const VAULT_ID  = process.env.VAULTGUARD_VAULT_ID;
const VAULT_URL = \`https://vaultguard.empresa.com.br/api/vault/\${VAULT_ID}\`;

async function loadVaultEnv() {
  const res = await fetch(VAULT_URL, {
    headers: { 'X-API-Key': API_KEY },
  });

  if (!res.ok) throw new Error(\`Vault error: \${res.status} \${await res.text()}\`);
  
  const data = await res.json();
  for (const entry of data.entries) {
    process.env[entry.key] = entry.value;
    console.log(\`✓ Carregado: \${entry.key}\`);
  }
}

module.exports = { loadVaultEnv };`} />
            </div>

            <InfoBox title="Boas práticas de segurança" color="green">
              <ul className="space-y-1 list-disc list-inside text-sm">
                <li>Nunca hardcode a API key no código-fonte. Use variáveis de ambiente.</li>
                <li>Configure <strong>allowedHosts</strong> no vault para restringir o acesso somente às VMs que precisam.</li>
                <li>Crie uma API key por VM/serviço — facilita a revogação seletiva.</li>
                <li>Rotacione as API keys periodicamente.</li>
                <li>Monitore os logs de auditoria regularmente.</li>
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
              Manual de Operação <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
