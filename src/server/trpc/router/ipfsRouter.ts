import { t } from "../trpc";
import { z } from "zod";
import NFTsService from "../../../utils/services/IPFSService";

export const ipfsRouter = t.router({
  getTraits: t.procedure.input(z.string()).query((input) => {
    const collection = NFTsService.traitsCollections.find(
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
