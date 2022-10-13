import React, { useState } from "react";
import { trpc } from "../../utils/trpc";
import { Trait } from "../../utils/services/IPFSService";
import TraitView from "./TraitView";
import { useRouter } from "next/router";
import { ELEMENTS_PER_PAGE } from "../../utils/Settings";

const NFTTraitsList = () => {
  let router = useRouter();
  const [page, setPage] = useState(1);

  const allTraitsQuery = trpc.ipfs.getTraits.useQuery(
    "bafybeievpwedrt7soo6nbgkdttmjjmpkcsjkzpyaz4zox74fr45blo5boe"
  );

  let startIndex = (page - 1) * ELEMENTS_PER_PAGE;
  let endIndex = page * ELEMENTS_PER_PAGE;

  let routerPage = router.query["page"];
  if (routerPage != undefined && parseInt(routerPage! as string) != page) {
    console.log(routerPage);
    setPage(parseInt(routerPage! as string));
  }

  let allTraits: Trait[] = allTraitsQuery.data?.traits ?? [];

  if (allTraitsQuery.isLoading) return <div> Loading... </div>;

  let paginatedTraits = allTraits.slice(startIndex, endIndex);
  console.log(paginatedTraits);

  return (
    <div className="m-2 justify-between self-center rounded-lg bg-slate-700 p-2">
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        {paginatedTraits.map((trait) => (
          <TraitView key={trait.type + trait.title} trait={trait} />
        ))}
      </div>
    </div>
  );
};

export default NFTTraitsList;