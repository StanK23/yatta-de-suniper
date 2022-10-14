import { t } from "../trpc";
import { z } from "zod";
import IPFSClient from "../../../utils/services/IPFSService";

export const ipfsRouter = t.router({
  parseMetadata: t.procedure
    .input(
      z.object({
        CID: z.string(),
        supply: z.number(),
        contractAddress: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return IPFSClient.traitsList(
        input.CID,
        input.supply,
        input.contractAddress
      );
    }),
  getTraits: t.procedure.input(z.string()).query((input) => {
    return (
      IPFSClient.traitsCollections.find(
        (collection) => collection.CID == input.input
      ) ?? { CID: input.input, traits: [] }
    );
  }),
});
