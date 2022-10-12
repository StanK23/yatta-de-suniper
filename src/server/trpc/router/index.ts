// src/server/router/index.ts
import { t } from "../trpc";

import { ipfsRouter } from "./ipfsRouter";

export const appRouter = t.router({
  ipfs: ipfsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
