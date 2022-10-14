import { hasUpperCase } from "../helpers";

class IPFSService {
  // Singleton
  static myInstance: any = null;

  static IPFS(): IPFSService {
    if (IPFSService.myInstance == null) {
      IPFSService.myInstance = new IPFSService();
    }
    return this.myInstance;
  }

  //   client: IPFS;
  static IPFS_HOSTS(CID: string, nftID: string, ext: string = ""): string[] {
    let isHasUpperCase = hasUpperCase(CID);

    if (isHasUpperCase || ext == ".png") {
      return [
        `https://gateway.ipfs.io/ipfs/${CID}/${nftID}${ext}`,
        // `https://gateway.ipfs.io/ipfs/${CID}/${nftID}${ext}`,
        // `https://cloudflare-ipfs.com/ipfs/${CID}/${nftID}${ext}`,
        // `https://ipfs.fleek.co/ipfs/${CID}/${nftID}${ext}`,
        // `https://gateway.pinata.cloud/ipfs/${CID}/${nftID}${ext}`,
        `https://ipfs.io/ipfs/${CID}/${nftID}${ext}`,
        // `https://jorropo.net/ipfs/${CID}/${nftID}${ext}`,
        // `https://ipfs.eth.aragon.network/ipfs/${CID}/${nftID}${ext}`,
        // `https://ipns.co/ipfs/${CID}/${nftID}${ext}`,
        // `https://ipfs.best-practice.se/ipfs/${CID}/${nftID}${ext}`,
        // `https://w3s.link/ipfs/${CID}/${nftID}${ext}`,
        // `https://ipfs.litnet.work/ipfs/${CID}/${nftID}${ext}`,
        // `https://ipfs.runfission.com/ipfs/${CID}/${nftID}${ext}`,
      ];
    } else {
      return [
        `https://${CID}.ipfs.ipfs-gateway.cloud/${nftID}`,
        // `https://${CID}.ipfs.cf-ipfs.com/${nftID}`,
        // `https://${CID}.ipfs.dweb.link/${nftID}`,
        // `https://${CID}.ipfs.nftstorage.link/${nftID}`,
        // `https://${CID}.ipfs.4everland.io/${nftID}`,
      ];
    }
  }

  // Properties
  traitsCollections: TraitsCollection[] = [];

  constructor() {}

  // Parse JSON from IPFS for collection and single NFT
  async getNFTMetadataByID(
    CID: string,
    nftID: number,
    nftIDs: number[]
  ): Promise<JSON> {
    let gateway = this.gatewayURL(CID, nftID, nftIDs);
    let metadata = await fetch(gateway!);
    return metadata.json();
  }

  // Choose ipfs gateway to use
  gatewayURL(CID: string, nftID: number, nftIDs: number[]): string {
    let gateways = IPFSService.IPFS_HOSTS(CID, nftID.toString(), ".json");

    const parsePerIPFS = Math.floor(nftIDs.length / gateways.length) + 1;
    let index = nftIDs.indexOf(nftID);
    const ipfsIndex: number = Math.floor(index / parsePerIPFS);

    return gateways[ipfsIndex]!;
  }

  // Mutation will run this method
  // This should fill current collections with parsed traits
  async traitsList(CID: string, supply: number, contractAddress: string) {
    // create an array with initial NFT IDs to parse
    const nftIDs = new Array(supply).fill(null).map((_, i) => i);

    let collectionByCID = this.traitsCollections.find(
      (collection) => collection.CID == CID
    );
    if (collectionByCID == undefined) {
      // Find collection or create new
      collectionByCID = {
        CID: CID,
        contractAddress: contractAddress,
        nftIDs: [],
        traits: [],
      };

      this.traitsCollections.push(collectionByCID);
    }

    // Fill collection with recursive fetched data
    await this.recursiveParseMetadata(collectionByCID, nftIDs);
    console.log("Parsed NFTs: ", collectionByCID.nftIDs.length);
  }

  async recursiveParseMetadata(
    collection: TraitsCollection,
    nftIDs: number[]
  ): Promise<TraitsCollection> {
    // Create promises array
    let collectionPromises: Promise<JSON>[] = [];

    // Create an array for a failed fetches to try again in the next cycle
    let errorIDs: number[] = [];

    // Main parse of metadata
    nftIDs.forEach((nftID) => {
      // Find already parsed NFT in current cycle
      // Parse only of no NFT yet
      let nftInDB = this.findNFT(collection, nftID);
      if (nftInDB == undefined) {
        let metadataPromise = this.getNFTMetadataByID(
          collection.CID,
          nftID,
          nftIDs
        );

        metadataPromise
          .then((json) => {
            // Filling NFT details from Metadata
            let metadata: Metadata = json as unknown as Metadata;
            let nftDetails: NFTDetails = this.getNFTDetails(
              metadata,
              nftID,
              collection.contractAddress
            );

            // Add or increment trait in collection
            for (const trait of metadata.attributes) {
              collection.traits = this.incrementTrait(
                collection.traits,
                trait.trait_type,
                trait.value,
                nftDetails
              );
            }

            // Save NFT ID in successfully parsed IDs array to not parse it again
            collection.nftIDs.push(nftID);
            // console.log("NFT ID Length:", collection.nftIDs.length);
          })
          .catch((error) => {
            // Retry only if NFT metadata actually existed on ipfs
            if (error.type != "invalid-json") {
              errorIDs.push(nftID);
            } else {
              console.log("Missed forever id: ", nftID);
            }
          });

        collectionPromises.push(metadataPromise);
      }
    });

    // Wait for all metadata
    await Promise.allSettled(collectionPromises);

    // Retry failed parses
    if (errorIDs.length > 0) {
      console.log(errorIDs);
      return this.recursiveParseMetadata(collection, errorIDs);
    } else {
      console.log("READY");

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

  findNFT(collection: TraitsCollection, nftID: number) {
    let nftInDB = collection.nftIDs.find((id) => id == nftID);
    return nftInDB;
  }

  getNFTDetails(
    metadata: Metadata,
    nftID: number,
    contractAddress: string
  ): NFTDetails {
    let imageIPFSStringArray = metadata.image.split("/");

    let CID = imageIPFSStringArray[2] ?? "0";
    let imageID = imageIPFSStringArray[3] ?? "0";

    let gatewayURL = IPFSService.IPFS_HOSTS(CID, imageID)[0] ?? "";

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

export type NFTDetails = {
  id: number;
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
  CID: string;
  contractAddress: string;
  nftIDs: number[];
  traits: Trait[];
};

type Metadata = {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
};

const IPFSClient = IPFSService.IPFS();
export default IPFSClient;
