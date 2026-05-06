import readline from "node:readline";
import crypto from "node:crypto";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../");
const envPath = path.join(rootDir, ".env");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(prompt: string, defaultValue = ""): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim() || defaultValue));
  });
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      rl.question(prompt, (answer) => resolve(answer.trim()));
      return;
    }
    process.stdout.write(prompt);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    let password = "";
    function handler(chunk: Buffer) {
      const char = chunk.toString("utf8");
      if (char === "\r" || char === "\n") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", handler);
        process.stdout.write("\n");
        resolve(password);
      } else if (char === "\u0003") {
        process.exit();
      } else if (char === "\u007f") {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else {
        password += char;
        process.stdout.write("*");
      }
    }
    stdin.on("data", handler);
  });
}

function line(char = "─", width = 60) {
  return char.repeat(width);
}

async function testConnection(url: string): Promise<boolean> {
  try {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("\n" + line());
  console.log("  VaultGuard — Assistente de Configuração");
  console.log(line());
  console.log("  Cria o arquivo .env com DATABASE_URL e SESSION_SECRET.\n");

  if (existsSync(envPath)) {
    const current = await readFile(envPath, "utf-8");
    const hasPlaceholder = current.includes("change_this") || current.includes("password@localhost");
    if (!hasPlaceholder) {
      const overwrite = await question("  Arquivo .env já configurado. Reconfigurar? [s/N]: ", "n");
      if (!overwrite.toLowerCase().startsWith("s")) {
        console.log("\n  Mantido sem alterações.\n");
        rl.close();
        return;
      }
    }
  }

  console.log("\n  Banco de dados PostgreSQL:");
  console.log("  (Pressione Enter para usar o valor padrão entre colchetes)\n");

  const host     = await question("  Host     [localhost]: ", "localhost");
  const port     = await question("  Porta    [5432]: ", "5432");
  const user     = await question("  Usuário  [postgres]: ", "postgres");
  const password = await questionHidden("  Senha    : ");
  const database = await question("  Database [vaultguard]: ", "vaultguard");

  const encodedUser = encodeURIComponent(user);
  const encodedPass = encodeURIComponent(password);
  const databaseUrl = `postgres://${encodedUser}:${encodedPass}@${host}:${port}/${database}`;

  console.log("\n  Testando conexão com o banco...");
  const ok = await testConnection(databaseUrl);
  if (ok) {
    console.log("  Conexão bem-sucedida.");
  } else {
    console.log("  Aviso: não foi possível conectar ao banco com as credenciais informadas.");
    const continuar = await question("  Continuar mesmo assim? [s/N]: ", "n");
    if (!continuar.toLowerCase().startsWith("s")) {
      console.log("\n  Cancelado. Nenhum arquivo foi alterado.\n");
      rl.close();
      return;
    }
  }

  const sessionSecret = crypto.randomBytes(64).toString("hex");

  const envContent = [
    `# Gerado por pnpm setup em ${new Date().toISOString()}`,
    ``,
    `# String de conexão PostgreSQL`,
    `DATABASE_URL=${databaseUrl}`,
    ``,
    `# Segredo para assinar tokens JWT (128 hex chars gerados automaticamente)`,
    `SESSION_SECRET=${sessionSecret}`,
    ``,
  ].join("\n");

  await writeFile(envPath, envContent, "utf-8");

  console.log("\n" + line());
  console.log("  Arquivo .env criado com sucesso!\n");
  console.log(`  DATABASE_URL  postgres://${user}:***@${host}:${port}/${database}`);
  console.log(`  SESSION_SECRET  [128 chars gerados aleatoriamente]\n`);
  console.log("  Próximos passos:");
  console.log("    pnpm --filter @workspace/api-server run dev   (cria tabelas automaticamente)");
  console.log("    pnpm --filter @workspace/vault-web run dev");
  console.log(line() + "\n");

  rl.close();
}

main().catch((err: Error) => {
  console.error("\n  Erro:", err.message, "\n");
  process.exit(1);
});
