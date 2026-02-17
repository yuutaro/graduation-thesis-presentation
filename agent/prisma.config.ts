import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // SQLiteのパスを指定 (環境変数または直接文字列)
    url: "file:./dev.db",
  },
});
