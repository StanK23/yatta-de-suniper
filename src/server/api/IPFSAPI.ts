import axios from "axios";
import { env } from "../../env/server.mjs";

export class IPFSAPI {
  static getCollectionNFT(
    ipfsCID: string,
    nftID: number,
    everyNFTID: number[],
    ext: string,
    abortController: AbortController
  ) {
    let url = requestURL(ipfsCID, nftID, everyNFTID, ext);
    return axios.get(url, {
      signal: abortController.signal,
    });
  }
}

// Choose ipfs gateway to use
function requestURL(
  ipfsCID: string,
  nftID: number,
  nftIDs: number[],
  ext: string
): string {
  let gateways = ipfsHosts(ipfsCID, nftID.toString(), ext);

  const parsePerIPFS = Math.floor(nftIDs.length / gateways.length) + 1;
  let index = nftIDs.indexOf(nftID);
  const apiIndex: number = Math.floor(index / parsePerIPFS);

  return gateways[apiIndex]!;
}

// client: IPFS;
function ipfsHosts(CID: string, nftID: string, ext: string = ""): string[] {
  return [`${env.IPFS_BASE_URL}${CID}/${nftID}${ext}`];
}
