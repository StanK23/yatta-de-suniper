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
  static IPFS_HOSTS(CID: string, nftID: number, ext: string = ""): string[] {
    let isHasUpperCase = hasUpperCase(CID);

    if (isHasUpperCase || ext == ".png") {
      return [
        `https://gateway.ipfs.io/ipfs/${CID}/${nftID}${ext}`,
        // `https://cloudflare-ipfs.com/ipfs/${CID}/${nftID}${ext}`,
        // `https://ipfs.fleek.co/ipfs/${CID}/${nftID}${ext}`,
        // `https://gateway.pinata.cloud/ipfs/${CID}/${nftID}${ext}`,
        // `https://ipfs.io/ipfs/${CID}/${nftID}${ext}`,
        // `https://jorropo.net/ipfs/${CID}/${nftID}${ext}`,
        // `https://ipfs.eth.aragon.network/ipfs/${CID}/${nftID}${ext}`,
        // `https://ipns.co/ipfs/${CID}/${nftID}${ext}`,
        // `https://ipfs.best-practice.se/ipfs/${CID}/${nftID}${ext}`,
        // `https://w3s.link/ipfs/${CID}/${nftID}${ext}`,
        // `https://ipfs.litnet.work/ipfs/${CID}/${nftID}${ext}`,
        // `https://ipfs.runfission.com/ipfs/${CID}/${nftID}${ext}`,
      ];
    }

    return [
      `https://${CID}.ipfs.ipfs-gateway.cloud/${nftID}`,
      // `https://${CID}.ipfs.cf-ipfs.com/${nftID}`,
      // `https://${CID}.ipfs.dweb.link/${nftID}`,
      // `https://${CID}.ipfs.nftstorage.link/${nftID}`,
      // `https://${CID}.ipfs.4everland.io/${nftID}`,
    ];
  }

  // Properties
  traitsCollection: TraitsCollection[] = [];

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
    let gateways = IPFSService.IPFS_HOSTS(CID, nftID, ".json");

    const parsePerIPFS = Math.floor(nftIDs.length / gateways.length) + 1;
    let index = nftIDs.indexOf(nftID);
    const ipfsIndex: number = Math.floor(index / parsePerIPFS);

    return gateways[ipfsIndex]!;
  }

  async traitsList(CID: string, supply: number, contractAddress: string) {
    let traitsCollection: Trait[] = [];

    // create an array with initial NFT IDs to parse
    const nftIDs = new Array(supply).fill(null).map((_, i) => i);

    let resultMetadata = await this.recursiveParseMetadata(
      CID,
      nftIDs,
      contractAddress,
      traitsCollection
    );

    let collection = this.traitsCollection.find(
      (collection) => collection.CID == CID
    );

    if (collection == undefined)
      this.traitsCollection.push({
        CID: CID,
        contractAddress: contractAddress,
        traits: resultMetadata,
      });
  }

  async recursiveParseMetadata(
    CID: string,
    nftIDs: number[],
    contractAddress: string,
    currentTraitsCollection: Trait[]
  ): Promise<Trait[]> {
    // Create promises array
    let collectionPromises: Promise<JSON>[] = [];

    // Create an array for a failed fetches to try again in the next cycle
    let errorIDs: number[] = [];

    // Main parse of metadata
    nftIDs.forEach((nftID) => {
      let metadataPromise = this.getNFTMetadataByID(CID, nftID, nftIDs);
      metadataPromise
        .then((json) => {
          let metadata: Metadata = json as unknown as Metadata;

          let nftDetails: NFTDetails = this.getNFTDetails(
            metadata,
            nftID,
            contractAddress
          );

          for (const trait of metadata.attributes) {
            currentTraitsCollection = this.incrementTrait(
              currentTraitsCollection,
              trait.trait_type,
              trait.value,
              nftDetails
            );
          }
        })
        .catch((error) => {
          // If NFT metadata not found, dont retry
          if (error.type != "invalid-json") errorIDs.push(nftID);
        });

      collectionPromises.push(metadataPromise);
    });

    await Promise.allSettled(collectionPromises);

    if (errorIDs.length > 0) {
      console.log(errorIDs);
      return this.recursiveParseMetadata(
        CID,
        errorIDs,
        contractAddress,
        currentTraitsCollection
      );
    } else {
      console.log("READY");

      // console.log(currentTraitsCollection);

      return (
        currentTraitsCollection
          // order traits array by type
          .sort((trait1: Trait, trait2: Trait) =>
            trait1.type > trait2.type ? 1 : -1
          )
          // order traits by rarity
          .sort((trait1: Trait, trait2: Trait) =>
            trait1.count >= trait2.count ? 1 : -1
          )
      );
    }
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
    metadata: Metadata,
    nftID: number,
    contractAddress: string
  ): NFTDetails {
    let CID = metadata.image.split("/")[2] ?? "0";
    let gatewayURL = IPFSService.IPFS_HOSTS(CID, nftID, ".png")[0] ?? "";
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
