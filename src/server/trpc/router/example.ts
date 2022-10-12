import { t } from "../trpc";
import { z } from "zod";
import IPFSClient from "../../../utils/services/IPFSService";

export const ipfsRouter = t.router({
  metadata: t.procedure
    // .input(z.object({ text: z.string().nullish() }).nullish())
    .mutation(() => {
      return IPFSClient.traitsList(
        "bafybeievpwedrt7soo6nbgkdttmjjmpkcsjkzpyaz4zox74fr45blo5boe",
        5000
      );
    }),
  getAll: t.procedure.query(({ ctx }) => {
    return ctx.prisma.example.findMany();
  }),
});
