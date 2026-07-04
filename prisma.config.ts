import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, env } from "prisma/config";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile();

export default defineConfig({
  engine: "js",
  experimental: {
    adapter: true,
  },
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  async adapter() {
    return new PrismaLibSQL({
      url: env("TURSO_DATABASE_URL"),
      authToken: env("TURSO_AUTH_TOKEN"),
    });
  },
});
