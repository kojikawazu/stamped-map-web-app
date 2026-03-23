import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // migrate/seed は DIRECT_URL（直接接続）を優先、なければ DATABASE_URL にフォールバック
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
