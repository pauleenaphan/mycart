import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { userRouter } from "~/server/api/routers/user";

export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => ({ ok: true as const })),
  user: userRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
