import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
  url: env("DIRECT_URL"),
  shadowDatabaseUrl: env("DIRECT_URL"), // Neon permite usar la misma DB como shadow
},
});