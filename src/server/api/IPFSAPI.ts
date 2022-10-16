import axios from "axios";
import { hasUpperCase } from "../../utils/helpers";

export class IPFSAPI {
  static getCollectionNFT(
    ipfsCID: string,
    nftID: number,
    everyNFTID: number[],
    ext: string,
    abortController: AbortController
  ) {
    let url = requestURL(ipfsCID, nftID, everyNFTID, ext);
    // console.log(url);
    return axios.get(url, {
      signal: abortController.signal,
      // timeout: 2000,
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
  // let isV2 = hasUpperCase(ipfsCID);
  let gateways = ipfsHosts(ipfsCID, nftID.toString(), ext);

  // let apiIndex = getRandomInt(gateways.length);

  const parsePerIPFS = Math.floor(nftIDs.length / gateways.length) + 1;
  let index = nftIDs.indexOf(nftID);
  const apiIndex: number = Math.floor(index / parsePerIPFS);

  return gateways[apiIndex]!;
}

// client: IPFS;
function ipfsHosts(CID: string, nftID: string, ext: string = ""): string[] {
  return [
    `http://70.34.242.23:8080/ipfs/${CID}/${nftID}${ext}`,
    // `https://gateway.ipfs.io/ipfs/${CID}/${nftID}${ext}`, // 247
    // `https://ipfs.io/ipfs/${CID}/${nftID}${ext}`, // 247
    // `https://gateway.pinata.cloud/${CID}/${nftID}${ext}`,
    // `https://hardbin.com/ipfs/${CID}/${nftID}${ext}`,
    // `https://jorropo.net/${CID}/${nftID}${ext}`,
  ];
}

// 0x856b5efe21cf134924f40f0124631298bb2204f6
// QmfHnrjiwBTMP2PEcNJn1jtg5mKopN1J5rXiiQJ6q6KxAG
