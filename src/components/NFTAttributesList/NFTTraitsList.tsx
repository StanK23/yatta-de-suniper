import React from "react";
import { trpc } from "../../utils/trpc";
import { Trait } from "../../utils/services/IPFSService";
import TraitView from "./TraitView";

const NFTTraitsList = () => {
  const allTraitsQuery = trpc.ipfs.getTraits.useQuery(
    "bafybeievpwedrt7soo6nbgkdttmjjmpkcsjkzpyaz4zox74fr45blo5boe"
  );

  let allTraits: Trait[] = allTraitsQuery.data?.traits ?? [];

  if (allTraitsQuery.isLoading) return <div> Loading... </div>;

  return (
    <div className="m-2 justify-between self-center rounded-lg bg-slate-700 p-2">
      <h1 className="mb-1 text-center text-xl">Rare traits</h1>
      <div className="grid md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
        {allTraits.map((trait) => (
          <TraitView key={trait.type + trait.title} trait={trait} />
        ))}
      </div>
    </div>
  );
};

export default NFTTraitsList;
