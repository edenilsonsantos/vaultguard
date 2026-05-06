# 🔐 VaultGuard

**Cofre de senhas e variáveis globais para equipes de TI**, com criptografia AES-256-CBC, autenticação dupla (API Key + Certificado), 2FA, controle de acesso granular e auditoria completa.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)

---

## Capturas de Tela

### Login e Credenciais de Demo
![Tela de Login](screenshots/login.jpg)

### Manual de Operação integrado
![Manual de Operação](screenshots/manual.jpg)

### Perfil e Autenticação de Dois Fatores (2FA)
![Perfil com 2FA ativo](screenshots/profile-2fa.png)

### Regras de Acesso via API
![Regras de Acesso via API](screenshots/api-access-rules.png)

### Criação de Novo Segredo
![Criação de Vault](screenshots/vault-new.png)

### Documentação da API
![Documentação da API](screenshots/api-manual.jpg)

---

## Funcionalidades

- **Dois tipos de segredo**: `Credencial` (valores protegidos — nunca exibidos no browser) e `Variável Global` (valores visíveis no sistema)
- **Criptografia AES-256-CBC** para todos os valores em repouso
- **Controle de acesso granular** por usuário e por IP/host por item
- **Autenticação dupla na API**: API Key + Certificado RSA (obrigatório)
- **2FA (TOTP)** via Google Authenticator, Authy etc.
- **Audit Logs**: histórico imutável de 30 dias de todos os acessos, com distinção entre origem Browser e API
- **Swagger UI** integrado para explorar e testar a API interativamente
- **Gestão de usuários** (admin): ativar/desativar, redefinir senha, alterar perfil
- **Reset de senha forçado**: admin redefine → usuário obrigado a trocar no próximo login
- **Política de senha forte**: 12+ chars, maiúscula, minúscula, número e especial

---

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 24 |
| Backend | Express 5 + TypeScript |
| Banco de dados | PostgreSQL + Drizzle ORM |
| Frontend | React + Vite + shadcn/ui + TanStack Query |
| Autenticação | JWT (24h) + bcryptjs |
| 2FA | TOTP (otplib v13) |
| Criptografia | AES-256-CBC (valores) + RSA 2048 (certificados, node-forge) |
| Monorepo | pnpm workspaces |

---

## Deploy

### Opção 1 — Replit (recomendado, sem configuração de servidor)

1. Faça um fork deste repositório no GitHub
2. Acesse [replit.com](https://replit.com) → **Import from GitHub**
3. O Replit detectará automaticamente o projeto. Configure as variáveis de ambiente (veja abaixo)
4. Clique em **Deploy**

### Opção 2 — Self-hosted (Linux/macOS)

**Pré-requisitos:** Node.js 20+, pnpm 9+, PostgreSQL 14+

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/vaultguard.git
cd vaultguard

# 2. Instale as dependências
pnpm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# 4. Aplique o schema no banco de dados
pnpm --filter @workspace/db run push

# 5. Inicie o servidor da API
pnpm --filter @workspace/api-server run dev

# 6. Em outro terminal, inicie o frontend
pnpm --filter @workspace/vault-web run dev
```

### Variáveis de ambiente obrigatórias

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL | `postgres://user:pass@localhost:5432/vaultguard` |
| `SESSION_SECRET` | Segredo para assinar tokens JWT (mínimo 64 chars) | `openssl rand -hex 64` |

---

## Primeira utilização

### Usuários pré-criados (seed)

O sistema é iniciado com 4 usuários para facilitar a exploração:

| Perfil | Usuário | Senha | Observação |
|---|---|---|---|
| Admin | `master` | `Otopodomundo182*` | Conta administrativa principal |
| Admin (demo) | `demo_admin` | `DC9H"lz70O\8aa` | Exibido na tela de login |
| Usuário (demo) | `demo_user` | `DC9H"lz70O\8aa` | Exibido na tela de login |

> ⚠️ **Importante:** Os usuários `demo_admin` e `demo_user` são exibidos publicamente na tela de login como atalho de demonstração. Em produção, recomenda-se desativá-los após criar suas próprias contas.

### Passo a passo: primeiro acesso em produção

**1. Acesse com a conta `master`**
```
Usuário: master
Senha:   Otopodomundo182*
```

**2. Crie seu próprio usuário administrador**

Acesse **Usuários → (não há opção de criar pela UI)** — registre via tela de login com uma senha forte, depois promova o usuário a Admin em **Usuários → Perfil → Selecione "Admin"**.

Ou, se preferir criar direto via API (com a sessão do `master`):
```bash
curl -X POST https://seu-dominio/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"seu_admin","email":"seu@email.com","password":"SuaSenhaForte123!","fullName":"Seu Nome"}'
```
Depois promova para admin em Usuários.

**3. Desative as credenciais de demonstração na tela de login**

Acesse **Configurações → "Exibir credenciais de demonstração"** → desative o toggle. As credenciais de demo deixarão de aparecer na tela de login.

**4. Desative os usuários demo**

Acesse **Usuários**, localize `demo_admin` e `demo_user` e desative o toggle de status de cada um. Usuários desativados não conseguem fazer login.

**5. Altere a senha do `master` ou desative-o também**

Acesse **Perfil → Segurança → Alterar Senha**, ou desative o usuário `master` em **Usuários** (certifique-se de que seu novo admin está ativo antes).

---

## Segurança do Perfil de Usuário

Cada usuário gerencia sua segurança na página **Perfil (Identidade & Acesso)**:

### Autenticação de Dois Fatores (2FA)

O VaultGuard suporta TOTP (Time-based One-Time Password) compatível com Google Authenticator, Authy, Bitwarden Authenticator e outros.

**Ativação:**
1. Perfil → aba **2FA** → clique em **"Configurar 2FA"**
2. Escaneie o QR code com seu app autenticador
3. Digite o código de 6 dígitos e confirme

Com 2FA ativo, após digitar usuário/senha, o sistema exige o código OTP antes de conceder acesso.

**Desativação:** é necessário fornecer um código OTP válido para confirmar a identidade.

### API Keys

API Keys permitem que VMs, scripts e pipelines consultem o cofre programaticamente.

- Cada key é armazenada apenas como hash SHA-256 — o valor real é exibido **uma única vez** no momento da criação
- Recomenda-se **uma key por serviço** — se comprometida, revogue apenas ela
- **API Key sozinha não é suficiente** — é obrigatório combinar com um Certificado

### Certificados de Cliente (RSA 2048)

Certificados de cliente são o segundo fator da autenticação na API.

- Gerado pelo servidor (RSA 2048, node-forge) — o PEM bundle é exibido uma única vez
- O **fingerprint** (SHA-256, formato `xx:xx:xx:...`) é o valor usado no header `X-Certificate`
- Certificados têm data de expiração configurável
- Antes de expirar: gere um novo, atualize as variáveis de ambiente nas VMs, revogue o antigo

```bash
# Exemplo de configuração em uma VM
export VAULTGUARD_API_KEY="vgk_xxxxxxxxxxxxxxxxxxxx"
export VAULTGUARD_CERT_FP="3a:b2:c1:d0:e9:f8:..."
```

---

## Segurança do Vault — Acesso via API

Para consultar um item do cofre via API, **todos os quatro requisitos devem ser satisfeitos simultaneamente**:

| # | Requisito | Detalhe |
|---|---|---|
| 1 | **Usuário com permissão** | A API Key pertence a um usuário que tem acesso ao vault solicitado |
| 2 | **Host autorizado** | Se o vault tiver restrição de IP, o IP da máquina deve estar na lista de hosts permitidos |
| 3 | **API Key válida** | Header `X-API-Key` com uma key ativa — validada pelo hash SHA-256 armazenado |
| 4 | **Certificado válido** | Header `X-Certificate` com o fingerprint de um certificado ativo, não expirado, do mesmo usuário da API Key |

> A restrição de IP é sempre aplicada. Mesmo com API Key + Certificado válidos, se o vault tiver hosts específicos configurados, o IP da máquina solicitante deve estar na lista. Não há exceção.

### Endpoints disponíveis para acesso programático

```
GET /api/healthz                    — Health check (sem autenticação)
GET /api/vault/byID/{id}            — Consultar vault pelo ID numérico
GET /api/vault/byName/{nome}        — Consultar vault pelo nome (case-insensitive)
```

### Exemplo de requisição (curl)

```bash
curl -X GET "https://seu-dominio/api/vault/byName/BD-Producao" \
  -H "X-API-Key: $VAULTGUARD_API_KEY" \
  -H "X-Certificate: $VAULTGUARD_CERT_FP"
```

### Exemplo de requisição (Python)

```python
import requests, os

headers = {
    "X-API-Key": os.environ["VAULTGUARD_API_KEY"],
    "X-Certificate": os.environ["VAULTGUARD_CERT_FP"],
}
resp = requests.get("https://seu-dominio/api/vault/byName/BD-Producao", headers=headers)
data = resp.json()

db_password = data["entries"]["DB_PASSWORD"]
```

### Proteção de Credenciais no Browser

Itens do tipo **Credencial** nunca retornam valores reais para sessões de browser (JWT). O campo sempre exibe `[PROTEGIDO]`. Os valores reais são retornados **somente** para requisições via API Key + Certificado com IP autorizado.

---

## Audit Logs

Acesse pelo menu **Audit Logs**. O sistema registra automaticamente todo acesso a itens do cofre.

**O que é registrado:**
- Usuário que acessou
- Item acessado
- Data e hora (timezone)
- IP de origem
- **Origem do acesso**: `Browser` (sessão JWT) ou `API` (via API Key)
- User agent (identificação do cliente)

**Retenção:** 30 dias  
**Filtros disponíveis:** por usuário e por item do vault  
**Paginação:** 20 registros por página

Os logs são imutáveis — não há interface para excluí-los. Permitem rastrear exatamente quem acessou o quê, quando e de onde.

---

## Swagger UI

O VaultGuard inclui uma interface Swagger UI para explorar e testar todos os endpoints da API diretamente no browser:

```
https://seu-dominio/api/swagger
```

A especificação OpenAPI está disponível em:
```
https://seu-dominio/api/swagger/spec
```

O Swagger inclui:
- Todos os endpoints documentados com schemas de entrada e saída
- Esquemas de autenticação (`Bearer JWT`, `X-API-Key`, `X-Certificate`)
- Exemplos de requisição e resposta
- Interface dark theme

---

## Estrutura do Projeto

```
artifacts/
  api-server/     — Express 5 API (porta 8080, prefixo /api)
  vault-web/      — React + Vite SPA (prefixo /)
lib/
  api-spec/       — Especificação OpenAPI (openapi.yaml) + config Orval
  api-client-react/ — Hooks React Query gerados automaticamente
  api-zod/        — Schemas Zod gerados automaticamente
  db/             — Drizzle ORM schema + migrações
```

### Comandos úteis

```bash
pnpm run typecheck                          # Typecheck completo
pnpm --filter @workspace/api-spec run codegen  # Regenerar hooks e schemas
pnpm --filter @workspace/db run push           # Aplicar schema no banco (dev)
```

---

## Licença

Distribuído sob a licença [MIT](LICENSE). Veja o arquivo `LICENSE` para mais detalhes.
