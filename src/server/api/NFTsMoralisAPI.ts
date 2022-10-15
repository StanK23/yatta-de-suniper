import axios from "axios";
import { env } from "../../env/server.mjs";

const nftMoralisAPI = axios.create({
  baseURL: "https://deep-index.moralis.io/api/v2/nft/",
  headers: {
    accept: "application/json",
    "X-API-Key": env.MORALIS_WEB3_API_KEY,
  },
  params: {
    chain: "eth",
    format: "decimal",
  },
});

export class NFTsMoralisAPI {
  static getCollection(contractAddress: string, cursor: string = "") {
    return nftMoralisAPI.get(`/${contractAddress}`, {
      params: { cursor: cursor },
    });
  }
}
