import { Router, type IRouter } from "express";
import type { Request, Response } from "express";

const router: IRouter = Router();

const spec = {
  openapi: "3.1.0",
  info: {
    title: "VaultGuard API",
    version: "1.0.0",
    description:
      "API REST do VaultGuard para consulta programática de credenciais e variáveis de ambiente.\n\n" +
      "## Autenticação\n\n" +
      "Todos os endpoints de consulta de vault requerem **ambos** os headers:\n\n" +
      "| Header | Descrição |\n" +
      "|--------|----------|\n" +
      "| `X-API-Key` | API Key gerada em Perfil → API Keys |\n" +
      "| `X-Certificate` | Fingerprint do certificado gerado em Perfil → Certificados |\n\n" +
      "A combinação API Key + Certificado identifica o usuário e suas permissões de acesso. **Não há restrição por IP/VM** — a segurança é garantida pelos dois fatores de autenticação.\n\n" +
      "Operações de escrita (criar, editar, excluir vault) são realizadas exclusivamente pela interface web.",
    contact: {
      name: "VaultGuard",
    },
  },
  servers: [{ url: "/api", description: "API Base Path" }],
  tags: [
    { name: "Vault — Consulta", description: "Leitura de itens do vault (requer API Key + Certificado)" },
    { name: "Vault — Gestão", description: "Criação, edição e exclusão (somente via browser/JWT)" },
    { name: "API Keys", description: "Gerenciamento de API Keys (somente via browser/JWT)" },
    { name: "Certificados", description: "Gerenciamento de certificados de cliente (somente via browser/JWT)" },
    { name: "Outros", description: "Health check, estatísticas, logs" },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
        description: "API Key gerada em Perfil → API Keys. Formato: `vgk_<base64url>`",
      },
      CertificateAuth: {
        type: "apiKey",
        in: "header",
        name: "X-Certificate",
        description:
          "Fingerprint SHA-256 do certificado gerado em Perfil → Certificados. " +
          "Formato: `AA:BB:CC:...` (hex separado por dois pontos, 32 bytes = 64 caracteres hex = 95 com separadores).",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "API key inválida ou inativa" },
        },
        required: ["error"],
      },
      VaultEntry: {
        type: "object",
        properties: {
          key: { type: "string", example: "DB_HOST" },
          value: { type: "string", example: "postgres.prod.internal" },
        },
        required: ["key", "value"],
      },
      VaultItem: {
        type: "object",
        properties: {
          id: { type: "integer", example: 7 },
          name: { type: "string", example: "BD-Producao" },
          category: { type: "string", enum: ["credencial", "variavel_global"], example: "credencial" },
          description: { type: ["string", "null"], example: "Banco de dados PostgreSQL de produção" },
          accessControl: { type: "string", enum: ["all", "specific"], example: "specific" },
          allowedUserIds: { type: "array", items: { type: "integer" }, example: [1, 3] },
          allowedHostsMode: { type: "string", enum: ["all", "specific"], example: "specific" },
          allowedHosts: { type: "array", items: { type: "string" }, example: ["10.0.1.50", "10.0.1.51"] },
          entries: {
            type: "array",
            items: { $ref: "#/components/schemas/VaultEntry" },
            example: [
              { key: "DB_HOST", value: "postgres.prod.internal" },
              { key: "DB_PASSWORD", value: "P@ssw0rd!Prod#2026" },
              { key: "DB_PORT", value: "5432" },
            ],
          },
          createdBy: { type: "integer", example: 1 },
          createdByUsername: { type: "string", example: "joao.silva" },
          createdAt: { type: "string", format: "date-time", example: "2026-04-01T10:00:00.000Z" },
          updatedAt: { type: "string", format: "date-time", example: "2026-05-04T20:00:00.000Z" },
        },
        required: ["id", "name", "category", "description", "accessControl", "allowedUserIds", "allowedHostsMode", "allowedHosts", "entries", "createdBy", "createdByUsername", "createdAt", "updatedAt"],
      },
      VaultItemSummary: {
        type: "object",
        properties: {
          id: { type: "integer", example: 7 },
          name: { type: "string", example: "BD-Producao" },
          category: { type: "string", enum: ["credencial", "variavel_global"], example: "credencial" },
          description: { type: ["string", "null"], example: "Banco de dados PostgreSQL de produção" },
          accessControl: { type: "string", enum: ["all", "specific"], example: "specific" },
          allowedHostsMode: { type: "string", enum: ["all", "specific"], example: "specific" },
          allowedHosts: { type: "array", items: { type: "string" }, example: ["10.0.1.50"] },
          entryCount: { type: "integer", example: 3 },
          createdBy: { type: "integer", example: 1 },
          createdByUsername: { type: "string", example: "joao.silva" },
          createdAt: { type: "string", format: "date-time", example: "2026-04-01T10:00:00.000Z" },
          updatedAt: { type: "string", format: "date-time", example: "2026-05-04T20:00:00.000Z" },
        },
        required: ["id", "name", "category", "description", "accessControl", "allowedHostsMode", "allowedHosts", "entryCount", "createdBy", "createdByUsername", "createdAt", "updatedAt"],
      },
      VaultStats: {
        type: "object",
        properties: {
          totalItems: { type: "integer", example: 12 },
          credentialCount: { type: "integer", example: 8 },
          globalVarCount: { type: "integer", example: 4 },
          totalEntries: { type: "integer", example: 47 },
          accessibleToMe: { type: "integer", example: 10 },
        },
        required: ["totalItems", "credentialCount", "globalVarCount", "totalEntries", "accessibleToMe"],
      },
      CreateVaultItemBody: {
        type: "object",
        properties: {
          name: { type: "string", example: "BD-Producao" },
          category: { type: "string", enum: ["credencial", "variavel_global"], example: "credencial" },
          description: { type: ["string", "null"], example: "Banco de dados PostgreSQL de produção" },
          accessControl: { type: "string", enum: ["all", "specific"], example: "specific" },
          allowedUserIds: { type: "array", items: { type: "integer" }, example: [1, 3] },
          allowedHostsMode: { type: "string", enum: ["all", "specific"], example: "all" },
          allowedHosts: { type: "array", items: { type: "string" }, example: [] },
          entries: {
            type: "array",
            items: { $ref: "#/components/schemas/VaultEntry" },
            example: [
              { key: "DB_HOST", value: "postgres.prod.internal" },
              { key: "DB_PASSWORD", value: "senhaForte123!" },
              { key: "DB_PORT", value: "5432" },
            ],
          },
        },
        required: ["name", "category", "accessControl", "entries"],
      },
      UpdateVaultItemBody: {
        type: "object",
        properties: {
          name: { type: "string", example: "BD-Producao-v2" },
          category: { type: "string", enum: ["credencial", "variavel_global"] },
          description: { type: ["string", "null"], example: "Atualizado" },
          accessControl: { type: "string", enum: ["all", "specific"] },
          allowedUserIds: { type: "array", items: { type: "integer" } },
          allowedHostsMode: { type: "string", enum: ["all", "specific"] },
          allowedHosts: { type: "array", items: { type: "string" } },
          entries: {
            type: "array",
            items: { $ref: "#/components/schemas/VaultEntry" },
            example: [
              { key: "DB_HOST", value: "" },
              { key: "DB_PASSWORD", value: "NovaSenha!2026" },
              { key: "DB_PORT", value: "" },
            ],
          },
        },
      },
      ApiKey: {
        type: "object",
        properties: {
          id: { type: "integer", example: 3 },
          name: { type: "string", example: "vm-producao-app1" },
          keyPrefix: { type: "string", example: "vgk_a1b2c3" },
          isActive: { type: "boolean", example: true },
          lastUsedAt: { type: ["string", "null"], format: "date-time", example: "2026-05-04T22:34:00.000Z" },
          createdAt: { type: "string", format: "date-time", example: "2026-04-01T10:00:00.000Z" },
        },
        required: ["id", "name", "keyPrefix", "isActive", "lastUsedAt", "createdAt"],
      },
      ApiKeyCreated: {
        type: "object",
        properties: {
          id: { type: "integer", example: 3 },
          name: { type: "string", example: "vm-producao-app1" },
          keyPrefix: { type: "string", example: "vgk_a1b2c3" },
          rawKey: {
            type: "string",
            example: "vgk_a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
            description: "Exibido apenas uma vez. Armazene imediatamente.",
          },
          createdAt: { type: "string", format: "date-time", example: "2026-05-04T22:00:00.000Z" },
        },
        required: ["id", "name", "keyPrefix", "rawKey", "createdAt"],
      },
      Certificate: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "vm-producao-cert" },
          fingerprint: {
            type: "string",
            example: "3a:b2:c1:d0:e9:f8:07:16:25:34:43:52:61:70:7f:8e:9d:ac:bb:ca:d9:e8:f7:06:15:24:33:42:51:60:6f:7e",
          },
          isActive: { type: "boolean", example: true },
          expiresAt: { type: "string", format: "date-time", example: "2027-05-04T00:00:00.000Z" },
          createdAt: { type: "string", format: "date-time", example: "2026-05-04T10:00:00.000Z" },
        },
        required: ["id", "name", "fingerprint", "isActive", "expiresAt", "createdAt"],
      },
      CertificateCreated: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "vm-producao-cert" },
          fingerprint: {
            type: "string",
            example: "3a:b2:c1:d0:e9:f8:07:16:25:34:43:52:61:70:7f:8e:9d:ac:bb:ca:d9:e8:f7:06:15:24:33:42:51:60:6f:7e",
          },
          isActive: { type: "boolean", example: true },
          expiresAt: { type: "string", format: "date-time", example: "2027-05-04T00:00:00.000Z" },
          createdAt: { type: "string", format: "date-time", example: "2026-05-04T10:00:00.000Z" },
          pemBundle: {
            type: "string",
            example: "-----BEGIN CERTIFICATE-----\nMIID...base64...\n-----END CERTIFICATE-----\n\n-----BEGIN PRIVATE KEY-----\nMIIE...base64...\n-----END PRIVATE KEY-----",
            description: "PEM completo (certificado + chave privada). Salvo apenas uma vez.",
          },
        },
        required: ["id", "name", "fingerprint", "isActive", "expiresAt", "createdAt", "pemBundle"],
      },
      HealthStatus: {
        type: "object",
        properties: { status: { type: "string", example: "ok" } },
        required: ["status"],
      },
    },
  },
  security: [{ ApiKeyAuth: [], CertificateAuth: [] }],
  paths: {
    "/healthz": {
      get: {
        tags: ["Outros"],
        operationId: "healthCheck",
        summary: "Health check",
        security: [],
        responses: {
          "200": {
            description: "Servidor operacional",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthStatus" },
                example: { status: "ok" },
              },
            },
          },
        },
      },
    },

    "/vault/byID/{id}": {
      get: {
        tags: ["Vault — Consulta"],
        operationId: "getVaultItemByID",
        summary: "Buscar vault por ID numérico",
        description:
          "Retorna todos os detalhes e entradas de um vault pelo seu ID numérico. " +
          "Para itens do tipo **Credencial**, retorna os valores reais. " +
          "O ID é visível na interface web em Vault → item → Metadados.",
        security: [{ ApiKeyAuth: [], CertificateAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", example: 7 },
            description: "ID numérico do vault (visível na UI em Metadados)",
          },
        ],
        responses: {
          "200": {
            description: "Vault encontrado com entradas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VaultItem" },
                examples: {
                  credencial: {
                    summary: "Vault do tipo Credencial (valores reais retornados)",
                    value: {
                      id: 7,
                      name: "BD-Producao",
                      category: "credencial",
                      description: "Banco de dados PostgreSQL de produção",
                      accessControl: "specific",
                      allowedUserIds: [1, 3],
                      allowedHostsMode: "all",
                      allowedHosts: [],
                      entries: [
                        { key: "DB_HOST", value: "postgres.prod.internal" },
                        { key: "DB_PASSWORD", value: "P@ssw0rd!Prod#2026" },
                        { key: "DB_PORT", value: "5432" },
                      ],
                      createdBy: 1,
                      createdByUsername: "joao.silva",
                      createdAt: "2026-04-01T10:00:00.000Z",
                      updatedAt: "2026-05-04T20:00:00.000Z",
                    },
                  },
                  variavel_global: {
                    summary: "Vault do tipo Variável Global",
                    value: {
                      id: 15,
                      name: "ENV-Backend",
                      category: "variavel_global",
                      description: "Variáveis de ambiente do backend de produção",
                      accessControl: "all",
                      allowedUserIds: [],
                      allowedHostsMode: "all",
                      allowedHosts: [],
                      entries: [
                        { key: "API_URL", value: "https://api.prod.empresa.com.br" },
                        { key: "LOG_LEVEL", value: "warn" },
                        { key: "MAX_CONNECTIONS", value: "100" },
                      ],
                      createdBy: 1,
                      createdByUsername: "joao.silva",
                      createdAt: "2026-03-15T08:00:00.000Z",
                      updatedAt: "2026-05-01T12:00:00.000Z",
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "API Key ou Certificado inválido/inativo",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  missing_key: { summary: "API Key ausente", value: { error: "API Key e Certificado são obrigatórios" } },
                  invalid_key: { summary: "API Key inválida", value: { error: "API key inválida ou inativa" } },
                  invalid_cert: { summary: "Certificado inválido", value: { error: "Certificado inválido, revogado ou expirado" } },
                  mismatch: { summary: "API Key e Certificado de usuários diferentes", value: { error: "API Key e Certificado não pertencem ao mesmo usuário" } },
                },
              },
            },
          },
          "403": {
            description: "Usuário não tem acesso a este vault",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Acesso negado" },
              },
            },
          },
          "404": {
            description: "Vault não encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Item não encontrado" },
              },
            },
          },
        },
      },
    },

    "/vault/byName/{name}": {
      get: {
        tags: ["Vault — Consulta"],
        operationId: "getVaultItemByName",
        summary: "Buscar vault por nome",
        description:
          "Retorna os detalhes e entradas de um vault pelo nome (insensível a maiúsculas/minúsculas). " +
          "Encode o nome na URL se houver espaços ou caracteres especiais. " +
          "Se houver dois vaults com o mesmo nome, retorna o primeiro encontrado — prefira `/byID/{id}` para precisão.",
        security: [{ ApiKeyAuth: [], CertificateAuth: [] }],
        parameters: [
          {
            name: "name",
            in: "path",
            required: true,
            schema: { type: "string", example: "BD-Producao" },
            description: "Nome do vault (URL-encoded se necessário, ex: `BD%20Produ%C3%A7%C3%A3o`)",
          },
        ],
        responses: {
          "200": {
            description: "Vault encontrado com entradas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VaultItem" },
                example: {
                  id: 7,
                  name: "BD-Producao",
                  category: "credencial",
                  description: "Banco de dados PostgreSQL de produção",
                  accessControl: "specific",
                  allowedUserIds: [1, 3],
                  allowedHostsMode: "all",
                  allowedHosts: [],
                  entries: [
                    { key: "DB_HOST", value: "postgres.prod.internal" },
                    { key: "DB_PASSWORD", value: "P@ssw0rd!Prod#2026" },
                    { key: "DB_PORT", value: "5432" },
                  ],
                  createdBy: 1,
                  createdByUsername: "joao.silva",
                  createdAt: "2026-04-01T10:00:00.000Z",
                  updatedAt: "2026-05-04T20:00:00.000Z",
                },
              },
            },
          },
          "401": {
            description: "API Key ou Certificado inválido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "API key inválida ou inativa" },
              },
            },
          },
          "403": {
            description: "Usuário não tem acesso a este vault",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Acesso negado" },
              },
            },
          },
          "404": {
            description: "Vault não encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: { error: "Item não encontrado" },
              },
            },
          },
        },
      },
    },

    "/vault/{id}": {
      get: {
        tags: ["Vault — Consulta"],
        operationId: "getVaultItem",
        summary: "Buscar vault por ID (alias)",
        description: "Equivalente a `/vault/byID/{id}`. Incluso para compatibilidade. Prefira `/vault/byID/{id}` para deixar o código mais explícito.",
        security: [{ ApiKeyAuth: [], CertificateAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer", example: 7 },
          },
        ],
        responses: {
          "200": {
            description: "Vault com entradas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VaultItem" },
                example: {
                  id: 7,
                  name: "BD-Producao",
                  category: "credencial",
                  description: "Banco de dados PostgreSQL de produção",
                  accessControl: "specific",
                  allowedUserIds: [1],
                  allowedHostsMode: "all",
                  allowedHosts: [],
                  entries: [
                    { key: "DB_HOST", value: "postgres.prod.internal" },
                    { key: "DB_PASSWORD", value: "P@ssw0rd!Prod#2026" },
                    { key: "DB_PORT", value: "5432" },
                  ],
                  createdBy: 1,
                  createdByUsername: "joao.silva",
                  createdAt: "2026-04-01T10:00:00.000Z",
                  updatedAt: "2026-05-04T20:00:00.000Z",
                },
              },
            },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" }, example: { error: "API key inválida ou inativa" } } } },
          "403": { description: "Acesso negado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" }, example: { error: "Acesso negado" } } } },
          "404": { description: "Não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" }, example: { error: "Item não encontrado" } } } },
        },
      },
      patch: {
        tags: ["Vault — Gestão"],
        operationId: "updateVaultItem",
        summary: "Atualizar vault (somente browser)",
        description: "Atualiza um vault existente. **Requer sessão ativa via browser (JWT)**. Não aceita API Key.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 7 } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateVaultItemBody" },
              examples: {
                update_hosts: {
                  summary: "Atualizar apenas a descrição",
                  value: { description: "BD PostgreSQL prod — versão 16" },
                },
                update_entries: {
                  summary: "Atualizar valor de uma credencial (string vazia = manter valor atual)",
                  value: {
                    entries: [
                      { key: "DB_HOST", value: "" },
                      { key: "DB_PASSWORD", value: "NovaS3nh@Forte#2026" },
                      { key: "DB_PORT", value: "" },
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Vault atualizado", content: { "application/json": { schema: { $ref: "#/components/schemas/VaultItem" } } } },
          "400": { description: "Corpo inválido", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" }, example: { error: "Campo obrigatório ausente" } } } },
          "401": { description: "Não autenticado (JWT obrigatório)", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" }, example: { error: "Authentication required" } } } },
          "404": { description: "Vault não encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" }, example: { error: "Item não encontrado" } } } },
        },
      },
      delete: {
        tags: ["Vault — Gestão"],
        operationId: "deleteVaultItem",
        summary: "Excluir vault (somente browser)",
        description: "Remove permanentemente um vault e todas as suas entradas. **Requer sessão ativa via browser (JWT)**. Esta ação é irreversível.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 7 } }],
        responses: {
          "204": { description: "Vault excluído (sem corpo de resposta)" },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" }, example: { error: "Authentication required" } } } },
        },
      },
    },

    "/vault": {
      get: {
        tags: ["Vault — Gestão"],
        operationId: "listVaultItems",
        summary: "Listar vaults (somente browser)",
        description: "Lista todos os vaults acessíveis ao usuário autenticado. **Requer sessão ativa via browser (JWT)**. Não retorna valores de credenciais.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista de vaults",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/VaultItemSummary" } },
                example: [
                  {
                    id: 7, name: "BD-Producao", category: "credencial",
                    description: "Banco de dados PostgreSQL de produção",
                    accessControl: "specific", allowedHostsMode: "all", allowedHosts: [],
                    entryCount: 3, createdBy: 1, createdByUsername: "joao.silva",
                    createdAt: "2026-04-01T10:00:00.000Z", updatedAt: "2026-05-04T20:00:00.000Z",
                  },
                  {
                    id: 15, name: "ENV-Backend", category: "variavel_global",
                    description: "Variáveis de ambiente do backend",
                    accessControl: "all", allowedHostsMode: "all", allowedHosts: [],
                    entryCount: 8, createdBy: 1, createdByUsername: "joao.silva",
                    createdAt: "2026-03-15T08:00:00.000Z", updatedAt: "2026-05-01T12:00:00.000Z",
                  },
                ],
              },
            },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" }, example: { error: "Authentication required" } } } },
        },
      },
      post: {
        tags: ["Vault — Gestão"],
        operationId: "createVaultItem",
        summary: "Criar vault (somente browser)",
        description: "Cria um novo vault. **Requer sessão ativa via browser (JWT)**. Não aceita API Key.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateVaultItemBody" },
              examples: {
                credencial: {
                  summary: "Criar vault de credencial",
                  value: {
                    name: "API-Stripe-Prod",
                    category: "credencial",
                    description: "Chaves de API do Stripe para produção",
                    accessControl: "specific",
                    allowedUserIds: [1, 3],
                    allowedHostsMode: "all",
                    allowedHosts: [],
                    entries: [
                      { key: "STRIPE_SECRET_KEY", value: "sk_live_XXXXXXXXXXXX" },
                      { key: "STRIPE_WEBHOOK_SECRET", value: "whsec_YYYYYYYYYY" },
                    ],
                  },
                },
                variavel_global: {
                  summary: "Criar vault de variável global",
                  value: {
                    name: "CONFIG-Frontend",
                    category: "variavel_global",
                    description: "Configurações públicas do frontend",
                    accessControl: "all",
                    allowedUserIds: [],
                    allowedHostsMode: "all",
                    allowedHosts: [],
                    entries: [
                      { key: "APP_NAME", value: "MinhaApp" },
                      { key: "SUPPORT_EMAIL", value: "suporte@empresa.com.br" },
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Vault criado", content: { "application/json": { schema: { $ref: "#/components/schemas/VaultItem" } } } },
          "400": { description: "Dados inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" }, example: { error: "Campo 'name' é obrigatório" } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" }, example: { error: "Authentication required" } } } },
        },
      },
    },

    "/vault/stats": {
      get: {
        tags: ["Outros"],
        operationId: "getVaultStats",
        summary: "Estatísticas do vault (somente browser)",
        description: "Retorna contagens gerais do vault. **Requer sessão ativa via browser (JWT)**.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Estatísticas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/VaultStats" },
                example: { totalItems: 12, credentialCount: 8, globalVarCount: 4, totalEntries: 47, accessibleToMe: 10 },
              },
            },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/apikeys": {
      get: {
        tags: ["API Keys"],
        operationId: "listApiKeys",
        summary: "Listar API Keys do usuário (somente browser)",
        description: "Lista as API Keys do usuário autenticado. **Requer sessão ativa via browser (JWT)**.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista de API Keys",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/ApiKey" } },
                example: [
                  { id: 3, name: "vm-producao-app1", keyPrefix: "vgk_a1b2c3", isActive: true, lastUsedAt: "2026-05-04T22:34:00.000Z", createdAt: "2026-04-01T10:00:00.000Z" },
                  { id: 4, name: "pipeline-ci", keyPrefix: "vgk_d4e5f6", isActive: true, lastUsedAt: null, createdAt: "2026-04-15T08:00:00.000Z" },
                ],
              },
            },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      post: {
        tags: ["API Keys"],
        operationId: "createApiKey",
        summary: "Gerar nova API Key (somente browser)",
        description: "Gera uma nova API Key. **Requer sessão ativa via browser (JWT)**. O valor bruto (`rawKey`) é exibido **apenas uma vez**.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", properties: { name: { type: "string", example: "vm-producao-app1" } }, required: ["name"] },
              example: { name: "vm-producao-app1" },
            },
          },
        },
        responses: {
          "201": {
            description: "API Key gerada (rawKey visível apenas nesta resposta)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiKeyCreated" },
                example: {
                  id: 3, name: "vm-producao-app1", keyPrefix: "vgk_a1b2c3",
                  rawKey: "vgk_a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
                  createdAt: "2026-05-04T22:00:00.000Z",
                },
              },
            },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/apikeys/{id}": {
      delete: {
        tags: ["API Keys"],
        operationId: "revokeApiKey",
        summary: "Revogar API Key (somente browser)",
        description: "Revoga uma API Key. **Requer sessão ativa via browser (JWT)**. Ação irreversível.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 3 } }],
        responses: {
          "204": { description: "API Key revogada (sem corpo)" },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/certificates": {
      get: {
        tags: ["Certificados"],
        operationId: "listCertificates",
        summary: "Listar certificados (somente browser)",
        description: "Lista os certificados do usuário autenticado. **Requer sessão ativa via browser (JWT)**.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista de certificados",
            content: {
              "application/json": {
                schema: { type: "array", items: { $ref: "#/components/schemas/Certificate" } },
                example: [
                  {
                    id: 1, name: "vm-producao-cert",
                    fingerprint: "3a:b2:c1:d0:e9:f8:07:16:25:34:43:52:61:70:7f:8e:9d:ac:bb:ca:d9:e8:f7:06:15:24:33:42:51:60:6f:7e",
                    isActive: true, expiresAt: "2027-05-04T00:00:00.000Z", createdAt: "2026-05-04T10:00:00.000Z",
                  },
                ],
              },
            },
          },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
      post: {
        tags: ["Certificados"],
        operationId: "generateCertificate",
        summary: "Gerar certificado de cliente (somente browser)",
        description:
          "Gera um certificado X.509 RSA-2048 para uso na autenticação API Key + Certificado. " +
          "**Requer sessão ativa via browser (JWT)**. O `pemBundle` (chave privada + certificado) é exibido **apenas uma vez**. " +
          "Após gerado, copie o **fingerprint** para usar no header `X-Certificate` nas requisições à API.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "vm-producao-cert" },
                  validityDays: { type: "integer", example: 365, description: "Validade em dias (ex: 365 = 1 ano)" },
                },
                required: ["name", "validityDays"],
              },
              example: { name: "vm-producao-cert", validityDays: 365 },
            },
          },
        },
        responses: {
          "201": {
            description: "Certificado gerado (pemBundle visível apenas nesta resposta)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CertificateCreated" },
                example: {
                  id: 1, name: "vm-producao-cert",
                  fingerprint: "3a:b2:c1:d0:e9:f8:07:16:25:34:43:52:61:70:7f:8e:9d:ac:bb:ca:d9:e8:f7:06:15:24:33:42:51:60:6f:7e",
                  isActive: true, expiresAt: "2027-05-04T00:00:00.000Z", createdAt: "2026-05-04T10:00:00.000Z",
                  pemBundle: "-----BEGIN CERTIFICATE-----\nMIID...base64...\n-----END CERTIFICATE-----\n\n-----BEGIN PRIVATE KEY-----\nMIIE...base64...\n-----END PRIVATE KEY-----",
                },
              },
            },
          },
          "400": { description: "Dados inválidos", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" }, example: { error: "validityDays deve ser um inteiro positivo" } } } },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },

    "/certificates/{id}": {
      delete: {
        tags: ["Certificados"],
        operationId: "revokeCertificate",
        summary: "Revogar certificado (somente browser)",
        description: "Revoga um certificado. **Requer sessão ativa via browser (JWT)**. Após revogado, requisições com o fingerprint deste certificado retornam 401.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } }],
        responses: {
          "204": { description: "Certificado revogado (sem corpo)" },
          "401": { description: "Não autenticado", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
        },
      },
    },
  },
};

function swaggerHtml(specUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VaultGuard — API Reference</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0a0a0a; }
    .swagger-ui { font-family: 'Inter', system-ui, sans-serif; }
    .swagger-ui .topbar { background: #0f1117; border-bottom: 1px solid #1e2130; padding: 8px 0; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .topbar-wrapper { justify-content: center; }
    .swagger-ui .info .title { color: #e2e8f0; }
    .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info table { color: #94a3b8; }
    .swagger-ui .info a { color: #38bdf8; }
    .swagger-ui .wrapper { background: #0f1117; }
    .swagger-ui .scheme-container { background: #0f1117; padding: 16px 0; box-shadow: none; border-bottom: 1px solid #1e2130; }
    .swagger-ui section.models { background: #0f1117; }
    .swagger-ui .opblock-tag { color: #e2e8f0; border-bottom: 1px solid #1e2130; }
    .swagger-ui .opblock { border-radius: 8px; margin: 8px 0; background: #161b27; border: 1px solid #1e2130; }
    .swagger-ui .opblock .opblock-summary { border-radius: 8px; }
    .swagger-ui .opblock.opblock-get { border-color: #1d4ed8; background: rgba(29,78,216,0.05); }
    .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #1d4ed8; }
    .swagger-ui .opblock.opblock-post { border-color: #15803d; background: rgba(21,128,61,0.05); }
    .swagger-ui .opblock.opblock-patch { border-color: #b45309; background: rgba(180,83,9,0.05); }
    .swagger-ui .opblock.opblock-delete { border-color: #b91c1c; background: rgba(185,28,28,0.05); }
    .swagger-ui .btn.authorize { background: #0ea5e9; border-color: #0ea5e9; color: #fff; border-radius: 6px; }
    .swagger-ui .btn.authorize svg { fill: #fff; }
    .swagger-ui .auth-container { background: #161b27; border: 1px solid #1e2130; border-radius: 8px; }
    .swagger-ui .dialog-ux .modal-ux { background: #0f1117; border: 1px solid #1e2130; border-radius: 12px; }
    .swagger-ui .dialog-ux .modal-ux-header { background: #161b27; border-bottom: 1px solid #1e2130; border-radius: 12px 12px 0 0; }
    .swagger-ui .dialog-ux .modal-ux-header h3 { color: #e2e8f0; }
    .swagger-ui label { color: #94a3b8; }
    .swagger-ui input[type=text], .swagger-ui input[type=password] { background: #0f1117; color: #e2e8f0; border: 1px solid #1e2130; border-radius: 6px; }
    .swagger-ui .model-box { background: #161b27; border-radius: 6px; }
    .swagger-ui table.model tr.property-row td { color: #94a3b8; }
    .topbar-custom { background: #0f1117; border-bottom: 1px solid #1e2130; padding: 12px 24px; display: flex; align-items: center; gap: 12px; }
    .topbar-custom svg { color: #0ea5e9; }
    .topbar-custom .title { color: #e2e8f0; font-weight: 700; font-size: 18px; font-family: system-ui; }
    .topbar-custom .badge { background: rgba(14,165,233,0.1); border: 1px solid rgba(14,165,233,0.3); color: #0ea5e9; font-size: 11px; padding: 2px 8px; border-radius: 999px; font-family: system-ui; }
    .topbar-custom .links { margin-left: auto; display: flex; gap: 16px; font-size: 13px; font-family: system-ui; }
    .topbar-custom .links a { color: #64748b; text-decoration: none; }
    .topbar-custom .links a:hover { color: #e2e8f0; }
    .topbar-custom .links a.primary { color: #0ea5e9; }
    .auth-hint { background: rgba(14,165,233,0.05); border: 1px solid rgba(14,165,233,0.2); border-radius: 8px; padding: 12px 16px; margin: 0 20px 16px; font-size: 13px; color: #64748b; font-family: system-ui; }
    .auth-hint strong { color: #e2e8f0; }
    .auth-hint code { background: #161b27; padding: 1px 5px; border-radius: 4px; font-size: 11px; color: #0ea5e9; }
  </style>
</head>
<body>
  <div class="topbar-custom">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    <span class="title">VaultGuard</span>
    <span class="badge">API Reference</span>
    <div class="links">
      <a href="/manual">Manual de Operação</a>
      <a href="/api-manual">Doc. da API</a>
      <a href="/login" class="primary">Fazer Login →</a>
    </div>
  </div>
  <div class="auth-hint">
    <strong>Para executar requisições de consulta de vault:</strong>
    clique em <strong>Authorize</strong> e preencha <code>X-API-Key</code> (sua API Key) e <code>X-Certificate</code> (fingerprint do certificado), ambos gerados em <strong>Perfil</strong> na interface web.
    Endpoints de gestão (criar/editar/excluir) requerem sessão ativa no browser — não disponíveis via API Key.
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
        deepLinking: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 2,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
        tagsSorter: "alpha",
        docExpansion: "list",
        filter: true,
      });
    };
  </script>
</body>
</html>`;
}

router.get("/swagger/spec", (_req: Request, res: Response): void => {
  res.json(spec);
});

router.get("/swagger", (_req: Request, res: Response): void => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(swaggerHtml("/api/swagger/spec"));
});

export default router;
