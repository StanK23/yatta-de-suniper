import { NFTsMoralisAPI } from "../../server/api/NFTsMoralisAPI";
import { hasUpperCase } from "../helpers";

class NFTsServiceClass {
  // Singleton
  static myInstance: any = null;

  static instance(): NFTsServiceClass {
    if (NFTsServiceClass.myInstance == null) {
      NFTsServiceClass.myInstance = new NFTsServiceClass();
    }
    return this.myInstance;
  }

  //   client: IPFS;
  static IPFS_HOSTS(CID: string, nftID: string, ext: string = ""): string[] {
    let isHasUpperCase = hasUpperCase(CID);

    if (isHasUpperCase || ext == ".png") {
      return [
        `https://gateway.ipfs.io/ipfs/${CID}/${nftID}${ext}`,
        `https://ipfs.io/ipfs/${CID}/${nftID}${ext}`,
      ];
    } else {
      return [`https://${CID}.ipfs.ipfs-gateway.cloud/${nftID}`];
    }
  }

  // Properties
  traitsCollections: TraitsCollection[] = [];
  nftsCount = 0;

  constructor() {}

  // Choose ipfs gateway to use
  gatewayURL(CID: string, nftID: number, nftIDs: number[]): string {
    let gateways = NFTsServiceClass.IPFS_HOSTS(CID, nftID.toString(), ".json");

    const parsePerIPFS = Math.floor(nftIDs.length / gateways.length) + 1;
    let index = nftIDs.indexOf(nftID);
    const ipfsIndex: number = Math.floor(index / parsePerIPFS);

    return gateways[ipfsIndex]!;
  }

  // ENTRY POINT FOR MUTATION
  // Mutation will run this method
  // This should fill current collections with parsed traits
  async traitsList(contractAddress: string) {
    let collectionByCA = this.traitsCollections.find(
      (collection) => collection.contractAddress == contractAddress
    );

    if (collectionByCA == undefined) {
      // Find collection or create new
      collectionByCA = {
        contractAddress: contractAddress,
        supply: 0,
        traits: [],
      };

      this.traitsCollections.push(collectionByCA);
    }

    this.nftsCount = 0;

    // Fill collection with recursive fetched data
    await this.recursiveParseNFTsMetadata(collectionByCA);
  }

  async recursiveParseNFTsMetadata(
    collection: TraitsCollection,
    cursor: string = ""
  ): Promise<TraitsCollection> {
    // Create promises array

    let currentCursor: string = "";

    // Make a request until there is no cursor anymore
    await NFTsMoralisAPI.getCollection(collection.contractAddress, cursor)
      .then((result) => {
        // parse result
        let collectionJSON: CollectionJSONType = result.data;
        collection.supply = collectionJSON.total;

        // Filling up the traits
        let nftsDetails: NFTJSONType[] = collectionJSON.result;
        this.nftsCount += nftsDetails.length;
        nftsDetails.map((details) => {
          let metadata: NFTMetadata = JSON.parse(details.metadata);

          // Filling NFT details from Metadata
          let nftDetails: NFTDetails | null = this.getNFTDetails(
            metadata,
            details.token_id,
            collection.contractAddress
          );

          if (nftDetails != null) {
            // Add or increment trait in collection
            for (const trait of metadata.attributes) {
              collection.traits = this.incrementTrait(
                collection.traits,
                trait.trait_type,
                trait.value,
                nftDetails
              );
            }
          }
        });
        // Setting up cursor to get new page
        currentCursor = collectionJSON.cursor;
        console.log(currentCursor);
      })
      .catch((error) => {
        console.log("Error: ", error);
      });

    if (
      currentCursor != undefined &&
      currentCursor != null &&
      currentCursor != ""
    ) {
      return this.recursiveParseNFTsMetadata(collection, currentCursor);
    } else {
      console.log("READY");
      console.log("NFTs parsed: ", this.nftsCount);
      return collection;
    }
  }

  raresOrderCollection(collection: TraitsCollection): TraitsCollection {
    collection.traits = collection.traits
      // order traits array by type
      .sort((trait1: Trait, trait2: Trait) =>
        trait1.title > trait2.title ? 1 : -1
      )
      // order traits array by type
      .sort((trait1: Trait, trait2: Trait) =>
        trait1.type > trait2.type ? 1 : -1
      )
      // order traits by rarity
      .sort((trait1: Trait, trait2: Trait) =>
        trait1.count >= trait2.count ? 1 : -1
      );

    return collection;
  }

  incrementTrait(
    collectionArray: Trait[],
    type: string,
    title: string,
    nftDetails: NFTDetails
  ): Trait[] {
    // Find already existed trait
    let trait = collectionArray.find((trait) => {
      let isTypeSame = trait.type == type;
      let isTitleSame = trait.title == title;

      return isTitleSame && isTypeSame;
    });

    // Create new trait and return it
    if (trait == undefined) {
      let newTrait: Trait = {
        type: type,
        title: title,
        count: 1,
        nfts: [nftDetails],
      };

      collectionArray.push(newTrait);
      return collectionArray;
    }

    trait.count += 1;
    trait.nfts.push(nftDetails);

    return collectionArray;
  }

  getNFTDetails(
    metadata: NFTMetadata,
    nftID: string,
    contractAddress: string
  ): NFTDetails | null {
    if (metadata == null) return metadata;

    let imageIPFSStringArray = metadata.image.split("/");

    let CID = imageIPFSStringArray[2] ?? "0";
    let imageID = imageIPFSStringArray[3] ?? "";

    let gatewayURL = NFTsServiceClass.IPFS_HOSTS(CID, imageID)[0] ?? "";

    let itemOpenSeaURL =
      "https://opensea.io/assets/ethereum/" + contractAddress + "/" + nftID;

    let nftDetails: NFTDetails = {
      id: nftID,
      title: metadata.name,
      CID: CID,
      gatewayURL: gatewayURL,
      openSeaURL: itemOpenSeaURL,
    };

    return nftDetails;
  }
}

type CollectionJSONType = {
  total: number;
  page: number;
  page_size: number;
  cursor: string;
  result: NFTJSONType[];
};

type NFTJSONType = {
  token_hash: string;
  token_address: string;
  token_id: string;
  block_number_minted: string;
  amount: string;
  contract_type: string;
  name: string;
  symbol: string;
  token_uri: string;
  metadata: string;
  last_token_uri_sync: string;
  last_metadata_sync: string;
};

export type NFTDetails = {
  id: string;
  title: string;
  CID: string;
  gatewayURL: string;
  openSeaURL: string;
};

export type Trait = {
  type: string;
  title: string;
  count: number;
  nfts: NFTDetails[];
};

export type TraitsCollection = {
  contractAddress: string;
  supply: number;
  traits: Trait[];
};

type NFTMetadata = {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
};

const NFTsService = NFTsServiceClass.instance();
export default NFTsService;
