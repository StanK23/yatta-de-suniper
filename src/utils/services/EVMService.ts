import { CHAIN_TYPE, CHAIN_ID } from "./../app-settings";
import { providers, Wallet, Contract, utils, Signer } from "ethers";
import { env } from "../../env/server.mjs";
import ERC721_ABI from "../../server/abi/ERC721.json";
import { getAddress } from "ethers/lib/utils";

class EVMService {
  // Singleton
  static myInstance: any = null;

  static instance(): EVMService {
    if (EVMService.myInstance == null) {
      EVMService.myInstance = new EVMService();
    }
    return this.myInstance;
  }

  CHAINS: CHAIN_TYPE = {
    [CHAIN_ID.ETH]: {
      ID: 1,
      NAME: "Ethereum",
      NODE: env.ETH_NODE,
      SYMBOL: "ETH",
    },
    [CHAIN_ID.BSC]: {
      ID: 56,
      NAME: "Binance Smart Chain",
      NODE: env.BSC_NODE,
      SYMBOL: "BNB",
    },
    [CHAIN_ID.POLYGON]: {
      ID: 137,
      NAME: "Polygon",
      NODE: env.POLYGON_NODE,
      SYMBOL: "MATIC",
    },
    [CHAIN_ID.ARBITRUM]: {
      ID: 42161,
      NAME: "Arbitrum",
      NODE: env.ARBITRUM_NODE,
      SYMBOL: "AETH",
    },
    [CHAIN_ID.OPTIMISM]: {
      ID: 10,
      NAME: "Optimism",
      NODE: env.OPTIMISM_NODE,
      SYMBOL: "ETH",
    },
  };

  // STATES
  chain = this.CHAINS.ETH;
  provider: providers.WebSocketProvider;
  wallet: Wallet;
  signer: Signer;

  constructor() {
    this.provider = new providers.WebSocketProvider(this.chain.NODE);

    this.wallet = new Wallet(env.WALLET_PRIVATE_KEY);
    this.signer = this.wallet.connect(this.provider);
    console.log("Current wallet -", this.wallet.address);

    this.provider.getBalance(this.wallet.address).then((result) => {
      console.log(result);
    });
  }

  async getIPFSInfo(contractAddress: string): Promise<{
    contractAddress: string;
    CID: string;
    ext: string;
    totalSupply: number;
  }> {
    // Connect to NFT contract

    let collectionContract = new Contract(
      contractAddress,
      ERC721_ABI,
      this.signer
    );

    // Get IPFS URL for any item
    let ipfsURI: string = await collectionContract.tokenURI("1");
    // Parse CID and ext
    let ipfsStringArray = ipfsURI.split("/");
    let chunkCount = ipfsStringArray.length;

    let CID = ipfsStringArray[chunkCount - 2] ?? "0";
    let fileString = ipfsStringArray[chunkCount - 1] ?? "";
    let fileFormat = fileString.split(".")[1];

    // Get Total Supply from contract
    let totalSupply: number = parseInt(await collectionContract.totalSupply());
    return {
      contractAddress: getAddress(contractAddress),
      CID: CID,
      ext: fileFormat == undefined ? "" : `.${fileFormat}`,
      totalSupply: totalSupply,
    };
  }

  //   switchChain(chain: CHAIN) {
  //     // Change current chain ID
  //     this.chain = chain;
  //     // Reconnect provider and wallets
  //     this.provider = new providers.WebSocketProvider(chain.NODE);
  //   }

  //   startConnection() {
  //     this.provider = new providers.WebSocketProvider(this.chain.NODE);

  //     let pingTimeout: NodeJS.Timer;
  //     let keepAliveInterval: NodeJS.Timer;

  //     this.provider._websocket.on("open", () => {
  //       console.log("~ Connected: ", this.chain.NAME, "NODE");
  //       keepAliveInterval = setInterval(() => {
  //         this.provider._websocket.ping();
  //         pingTimeout = setTimeout(() => {
  //           this.provider._websocket.terminate();
  //         }, DEFAULT_SETTINGS.EXPECTED_PONG_BACK);
  //       }, DEFAULT_SETTINGS.KEEP_ALIVE_CHECK_INTERVAL);

  //       this.reconnect();
  //     });

  //     this.provider._websocket.on("close", () => {
  //       console.log("~ Reconnecting...");

  //       clearInterval(keepAliveInterval);
  //       clearTimeout(pingTimeout);
  //       this.startConnection();
  //     });

  //     this.provider._websocket.on("pong", () => {
  //       clearInterval(pingTimeout);
  //     });
  //   }

  //   reconnect() {
  //     // Connect wallets
  //     this.wallet = new Wallet(env.WALLET_PRIVATE_KEY);
  //     this.signer = this.wallet.connect(this.provider);

  //     // // Connect to smart contract
  //     // this.darthApeContract = new Contract(
  //     //   ADDRESSES().DARTH_APE,
  //     //   this.darthApeABI,
  //     //   this.signer
  //     // );
  //   }
}

const EVM = EVMService.instance();
export default EVM;
