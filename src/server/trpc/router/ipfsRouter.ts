import { t } from "../trpc";
import { z } from "zod";
import NFTsService from "../../../utils/services/IPFSService";

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
      return NFTsService.traitsList(
        input.CID,
        input.supply,
        input.contractAddress
      );
    }),
  getTraits: t.procedure.input(z.string()).query((input) => {
    let collection = NFTsService.traitsCollections.find(
      (collection) => collection.CID == input.input
    ) ?? { CID: input.input, contractAddress: "", nfts: [], traits: [] };

    return NFTsService.raresOrderCollection(collection);
  }),
  cancelParse: t.procedure.mutation(() => {
    NFTsService.nftMetadataAbortController.abort();
  }),
  resetAbortController: t.procedure.mutation(() => {
    NFTsService.resetAbortController();
  }),
});
