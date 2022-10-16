import React from "react";
import { NFTDetails } from "../../utils/services/IPFSService";

const NFTPreview = ({ nftDetails }: { nftDetails: NFTDetails }) => {
  return (
    <div className="m-1 items-center overflow-hidden rounded-lg bg-slate-800">
      <a
        href={nftDetails.openSeaURL}
        target="_blank"
        className="flex flex-row items-center justify-between"
      >
        <img src={nftDetails.gatewayURL} alt="" className="h-12 align-middle" />
        <div className="flex flex-grow flex-col justify-evenly p-2 text-left">
          <div className="w-full text-xs">{nftDetails.title}</div>
          <div className="w-full text-xs font-bold">0.01 ETH</div>
        </div>
      </a>
    </div>
  );
};

export default NFTPreview;
