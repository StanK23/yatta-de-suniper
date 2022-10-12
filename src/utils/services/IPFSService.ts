import { number } from "zod";
import { delay } from "../delay";

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
  static IPFS_HOSTS(CID: string, nftID: number): string[] {
    return [
      `https://${CID}.ipfs.ipfs-gateway.cloud/${nftID}`,
      //   `https://${CID}.ipfs.cf-ipfs.com/${nftID}`,
      //   `https://${CID}.ipfs.w3s.link/${nftID}`,
      //   `https://${CID}.ipfs.nftstorage.link/${nftID}`,
      //   `https://${CID}.ipfs.4everland.io/${nftID}`,

      //   `https://gateway.ipfs.io/ipfs/${CID}/${nftID}`,
      //   `https://cloudflare-ipfs.com/ipfs/${CID}/${nftID}`,
      //   `https://ipfs.fleek.co/ipfs/${CID}/${nftID}`,
      //   `https://gateway.pinata.cloud/ipfs/${CID}/${nftID}`,
      //   `https://ipfs.io/ipfs/${CID}/${nftID}`,
      //   `https://jorropo.net/ipfs/${CID}/${nftID}`,
      //   `https://ipfs.eth.aragon.network/ipfs/${CID}/${nftID}`,
      //   `https://ipns.co/ipfs/${CID}/${nftID}`,
      //   `https://ipfs.best-practice.se/ipfs/${CID}/${nftID}`,
      //   `https://w3s.link/ipfs/${CID}/${nftID}`,
      //   `https://ipfs.litnet.work/ipfs/${CID}/${nftID}`,
      //   `https://ipfs.runfission.com/ipfs/${CID}/${nftID}`,
    ];
  }

  constructor() {}

  // Parse JSON from IPFS for collection and single NFT
  async getNFTMetadataByID(
    CID: string,
    nftID: number
    // supply: number
  ): Promise<JSON> {
    // let gateway = this.gatewayURL(CID, nftID, supply);
    // let metadata = await fetch(gateway!);
    let metadata = await fetch(IPFSService.IPFS_HOSTS(CID, nftID)[0]!);
    return metadata.json();
  }

  gatewayURL(CID: string, nftID: number, supply: number): string {
    let gateways = IPFSService.IPFS_HOSTS(CID, nftID);

    const parsePerIPFS = Math.floor(supply / gateways.length) + 1;
    const ipfsIndex: number = Math.floor(nftID / parsePerIPFS);

    return gateways[ipfsIndex]!;
  }

  async traitsList(CID: string, supply: number) {
    let collectionPromises = [];
    let traitsCollection: Trait[] = [];

    let errors = 0;
    let errorID: number[] = [];

    // create an array with initial NFT IDs to parse
    const nftIDs = new Array(supply).fill(null).map((_, i) => i + 1);

    for (let nftID = 1; nftID <= supply; nftID++) {
      let metadataPromise = this.getNFTMetadataByID(CID, nftID, supply)
        .then((json) => {
          let metadata: Metadata = json as unknown as Metadata;

          for (const trait of metadata.attributes) {
            traitsCollection = this.incrementTrait(
              traitsCollection,
              trait.trait_type,
              trait.value,
              nftID
            );
          }
        })
        .catch((error) => {
          errors += 1;
          errorID.push(nftID);
        });

      collectionPromises.push(metadataPromise);
    }

    await Promise.allSettled(collectionPromises);

    console.log("HERE WE GO");
    console.log(traitsCollection);

    console.log(`Number of errors ${errors}`);
    console.log(`Error IDs - ${errorID}`);
  }

  async recursiveParseMetadata(
    CID: string,
    nftIDs: number[],
    currentTraitsCollection: Trait[]
  ): Promise<{ nftsIDToParse: number[]; traits: Trait[] }> {
    // Create promises array
    let collectionPromises: Promise<JSON>[] = [];

    // Create an array for a failed fetches to try again in the next cycle
    let errors = 0;
    let errorIDs: number[] = [];

    // Main parse of metadata
    nftIDs.forEach((nftID) => {
      let metadataPromise = this.getNFTMetadataByID(CID, nftID);
      metadataPromise
        .then((json) => {
          let metadata: Metadata = json as unknown as Metadata;

          for (const trait of metadata.attributes) {
            currentTraitsCollection = this.incrementTrait(
              currentTraitsCollection,
              trait.trait_type,
              trait.value,
              nftID
            );
          }
        })
        .catch((error) => {
          errors += 1;
          errorIDs.push(nftID);
        });

      collectionPromises.push(metadataPromise);
    });

    await Promise.allSettled(collectionPromises);

    console.log(`Number of errors ${errors}`);

    return {
      nftsIDToParse: errorIDs,
      traits: currentTraitsCollection,
    };
  }

  incrementTrait(
    collectionArray: Trait[],
    type: string,
    title: string,
    nftID: number
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
        nfts: [nftID],
      };

      collectionArray.push(newTrait);
      return collectionArray;
    }

    trait.count += 1;
    trait.nfts.push(nftID);

    return collectionArray;
  }
}

type Trait = {
  type: string;
  title: string;
  count: number;
  nfts: number[];
};

type Metadata = {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
};

const IPFSClient = IPFSService.IPFS();
export default IPFSClient;
