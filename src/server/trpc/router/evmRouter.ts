import { t } from "../trpc";
import { z } from "zod";
import EVM from "../../../utils/services/EVMService";
import NFTsService from "../../../utils/services/IPFSService";

export const evmRouter = t.router({
  getIPFSInfo: t.procedure
    .input(z.string())
    .mutation(async (contractAddress) => {
      let ipfsInfo = await EVM.getIPFSInfo(contractAddress.input);
      await NFTsService.traitsList(
        ipfsInfo.CID,
        ipfsInfo.totalSupply,
        ipfsInfo.contractAddress,
        ipfsInfo.ext
      );
      return ipfsInfo;
    }),
});
