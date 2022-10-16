import { NFTS_PER_CHUNK } from "./../app-settings";
import { IPFSAPI } from "../../server/api/IPFSAPI";
import { setMaxListeners } from "events";
import { spliceIntoChunks, startsWithNumber } from "../helpers";

class NFTsServiceClass {
  // Singleton
  static myInstance: any = null;

  static IPFS(): NFTsServiceClass {
    if (NFTsServiceClass.myInstance == null) {
      NFTsServiceClass.myInstance = new NFTsServiceClass();
    }
    return this.myInstance;
  }

  // Properties
  traitsCollections: TraitsCollection[] = [];
  nftMetadataAbortController = new AbortController();

  // Mutation will run this method
  // This should fill current collections with parsed traits
  async traitsList(
    CID: string,
    totalSupply: number,
    contractAddress: string,
    ext: string
  ) {
    // (await this.ipfs).start();

    // create an array with initial NFT IDs to parse
    const nftIDs = new Array(totalSupply).fill(null).map((_, i) => i);

    let collectionByCID = this.traitsCollections.find(
      (collection) => collection.CID == CID
    );
    if (collectionByCID == undefined) {
      // Find collection or create new
      collectionByCID = {
        CID: CID,
        contractAddress: contractAddress,
        nfts: [],
        traits: [],
      };

      this.traitsCollections.push(collectionByCID);
    }

    // Fill collection with recursive fetched data
    await this.recursiveParseMetadata(collectionByCID, nftIDs, ext);
    console.log("Parsed NFTs: ", Object.keys(collectionByCID.nfts).length);
  }

  async recursiveParseMetadata(
    collection: TraitsCollection,
    nftIDs: number[],
    ext: string
  ): Promise<TraitsCollection> {
    // Create an array for a failed fetches to try again in the next cycle
    const errorIDs: number[] = [];

    // Divide requests to chunks
    const chunksForRequests = spliceIntoChunks(nftIDs, NFTS_PER_CHUNK);

    for (
      let chunkIndex = 0;
      chunkIndex < chunksForRequests.length;
      chunkIndex++
    ) {
      const chunk = chunksForRequests[chunkIndex];

      // Create promises array
      const chunkPromises: any = [];
      // Main parse of metadata
      chunk?.forEach((nftID) => {
        // Find already parsed NFT in current cycle
        // Parse only of no NFT yet
        const nftInDB = this.findNFT(collection, nftID);

        if (nftInDB == undefined || !nftInDB.persist) {
          // console.log(nftInDB);
          // Make a get request to ipfs
          const metadataPromise = IPFSAPI.getCollectionNFT(
            collection.CID,
            nftID,
            chunk,
            ext,
            this.nftMetadataAbortController!
          );

          metadataPromise
            .then((response) => {
              // Filling NFT details from Metadata
              const metadata: NFTMetadata = response.data;
              this.onSuccessMetadataParse(metadata, nftID, collection);
            })
            .catch((error) => {
              const errorNFTID = this.onFailedMetadataParse(
                error,
                nftID,
                collection
              );
              if (errorNFTID != undefined) errorIDs.push(nftID);
            });

          chunkPromises.push(metadataPromise);
        }
      });

      // Wait for all metadata
      await Promise.allSettled(chunkPromises);
    }

    // Retry failed parses
    if (errorIDs.length > 0) {
      console.log(errorIDs);
      return this.recursiveParseMetadata(collection, errorIDs, ext);
    } else {
      console.log("READY");
      return collection;
    }
  }

  onSuccessMetadataParse(
    metadata: NFTMetadata,
    nftID: number,
    collection: TraitsCollection
  ) {
    const nftDetails: NFTDetails | null = this.getNFTDetails(
      metadata,
      nftID,
      collection.contractAddress
    );

    if (nftDetails != null) {
      let attributes = metadata.attributes;
      if (!Array.isArray(metadata.attributes)) {
        attributes = [
          {
            trait_type: metadata.attributes,
            value: metadata.attributes,
          },
        ];
      }
      // Add or increment trait in collection
      for (const trait of attributes) {
        collection.traits = this.incrementTrait(
          collection.traits,
          trait.trait_type,
          trait.value,
          nftDetails
        );
      }

      // Save NFT ID in successfully parsed IDs array to not parse it again
      collection.nfts[nftID] = nftDetails;
      nftDetails.persist = true;
    }
  }

  onFailedMetadataParse(
    error: any,
    nftID: number,
    collection: TraitsCollection
  ): number | undefined {
    // console.log(error.code, error.response);
    // Retry only if NFT metadata actually existed on ipfs
    if (error.response != undefined && error.response.status == 404) {
      console.log("Missed forever id: ", nftID);
    } else if (error.code == "ERR_CANCELED") {
      collection.nfts[nftID] = this.createEmptyNFTDetails(
        nftID,
        collection.CID
      );
    } else {
      return nftID;
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
    const trait = collectionArray.find((trait) => {
      const isTypeSame = trait.type == type;
      const isTitleSame = trait.title == title;

      return isTitleSame && isTypeSame;
    });

    // Create new trait and return it
    if (trait == undefined) {
      const newTrait: Trait = {
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

  findNFT(collection: TraitsCollection, nftID: number) {
    const nftInDB = collection.nfts[nftID];
    return nftInDB;
  }

  getNFTDetails(
    metadata: NFTMetadata,
    nftID: number,
    contractAddress: string
  ): NFTDetails | null {
    if (metadata == null) return metadata;

    const imageIPFSStringArray = metadata.image.split("/");

    const chunkCount = imageIPFSStringArray.length;
    let CID = imageIPFSStringArray[chunkCount - 2] ?? "0";
    let imageID = imageIPFSStringArray[chunkCount - 1] ?? "";

    if (!startsWithNumber(imageID)) {
      CID = imageID;
      imageID = "";
    }

    // console.log(metadata);

    const gatewayURL = `https://gateway.ipfs.io/ipfs/${CID}/${imageID}`;

    const itemOpenSeaURL =
      "https://opensea.io/assets/ethereum/" + contractAddress + "/" + nftID;

    const nftDetails: NFTDetails = {
      id: nftID,
      title: metadata.name == undefined ? metadata.title : metadata.name,
      CID: CID,
      gatewayURL: gatewayURL,
      openSeaURL: itemOpenSeaURL,
      persist: false,
    };

    return nftDetails;
  }

  resetAbortController() {
    this.nftMetadataAbortController = new AbortController();
    setMaxListeners(0, this.nftMetadataAbortController.signal);
    console.log("Abort resetted");
  }

  createEmptyNFTDetails(nftID: number, CID: string) {
    return {
      id: nftID,
      title: "",
      openSeaURL: "",
      gatewayURL: "",
      CID: CID,
      persist: false,
    };
  }
}

export type NFTDetails = {
  id: number;
  title: string;
  CID: string;
  gatewayURL: string;
  openSeaURL: string;
  persist: boolean;
};

export type Trait = {
  type: string;
  title: string;
  count: number;
  nfts: NFTDetails[];
};

export type TraitsCollection = {
  CID: string;
  contractAddress: string;
  nfts: { [nftId: number]: NFTDetails };
  traits: Trait[];
};

type NFTMetadata = {
  title: string;
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
};

const NFTs = NFTsServiceClass.IPFS();
export default NFTs;
