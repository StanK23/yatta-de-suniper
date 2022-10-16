import { evmRouter } from "./evmRouter";
// src/server/router/index.ts
import { t } from "../trpc";

import { ipfsRouter } from "./ipfsRouter";

export const appRouter = t.router({
  ipfs: ipfsRouter,
  evm: evmRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
