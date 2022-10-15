import React from "react";
import { Trait } from "../../utils/services/IPFSService";
import NFTPreview from "./NFTPreview";

const TraitView = ({ trait }: { trait: Trait }) => {
  return (
    <div className="m-1 flex flex-col overflow-hidden rounded-lg bg-slate-600">
      <div className="flex flex-row justify-start bg-slate-800">
        <div className="m-2 flex flex-col text-center align-middle">
          <span className="hf rounded-lg bg-teal-500 p-1 px-4 font-bold">
            {trait.count}
          </span>
        </div>
        <div className="h-fit flex-shrink self-center align-middle font-bold">
          {trait.type}: {trait.title}
        </div>
      </div>
      <hr></hr>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {trait.nfts.map((nft) => (
          <NFTPreview nftDetails={nft} />
        ))}
      </div>
    </div>
  );
};

export default TraitView;
