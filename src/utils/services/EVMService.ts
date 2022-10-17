import { CHAIN_TYPE, CHAIN_ID } from "./../app-settings";
import { providers, Contract } from "ethers";
import { env } from "../../env/server.mjs";
import { getAddress } from "ethers/lib/utils";

class EVMService {
  // Singconston
  static myInstance: any = null;

  static instance(): EVMService {
    if (EVMService.myInstance == null) {
      EVMService.myInstance = new EVMService();
    }
    return this.myInstance;
  }

  ERC721_ABI = [
    "function tokenURI(uint256 tokenId) public view returns (string)",
    "function totalSupply() external view returns (uint256)",
  ];

  // CHAINS: CHAIN_TYPE = {
  //   [CHAIN_ID.ETH]: {
  //     ID: 1,
  //     NAME: "Ethereum",
  //     NODE: env.ETH_NODE,
  //     SYMBOL: "ETH",
  //   },
  //   [CHAIN_ID.BSC]: {
  //     ID: 56,
  //     NAME: "Binance Smart Chain",
  //     NODE: "",
  //     SYMBOL: "BNB",
  //   },
  //   [CHAIN_ID.POLYGON]: {
  //     ID: 137,
  //     NAME: "Polygon",
  //     NODE: "",
  //     SYMBOL: "MATIC",
  //   },
  //   [CHAIN_ID.ARBITRUM]: {
  //     ID: 42161,
  //     NAME: "Arbitrum",
  //     NODE: "",
  //     SYMBOL: "AETH",
  //   },
  //   [CHAIN_ID.OPTIMISM]: {
  //     ID: 10,
  //     NAME: "Optimism",
  //     NODE: "",
  //     SYMBOL: "ETH",
  //   },
  // };

  async getIPFSInfo(contractAddress: string): Promise<{
    contractAddress: string;
    CID: string;
    ext: string;
    totalSupply: number;
  }> {
    const provider = new providers.JsonRpcProvider(env.ETH_NODE);
    // Connect to NFT contract

    const collectionContract = new Contract(
      contractAddress,
      this.ERC721_ABI,
      provider
    );

    // Get IPFS URL for any item
    const ipfsURI: string = await collectionContract.tokenURI("1");
    // Parse CID and ext
    const ipfsStringArray = ipfsURI.split("/");
    const chunkCount = ipfsStringArray.length;

    const CID = ipfsStringArray[chunkCount - 2] ?? "0";
    const fileString = ipfsStringArray[chunkCount - 1] ?? "";
    const fileFormat = fileString.split(".")[1];

    // Get Total Supply from contract
    const totalSupply: number = parseInt(
      await collectionContract.totalSupply()
    );
    return {
      contractAddress: getAddress(contractAddress),
      CID: CID,
      ext: fileFormat == undefined ? "" : `.${fileFormat}`,
      totalSupply: totalSupply,
    };
  }
}

const EVM = EVMService.instance();
export default EVM;
