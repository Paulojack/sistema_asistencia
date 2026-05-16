import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  datasource: {
    // Usamos DIRECT_URL para db push/migrate
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
  migrations: {
    // Comando para ejecutar el seed (Usamos tsx para TypeScript)
    seed: 'npx tsx prisma/seed.ts',
  },
});
