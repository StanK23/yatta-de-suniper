import React, { useState } from "react";
import { trpc } from "../../utils/trpc";
import { Trait } from "../../utils/services/IPFSService";
import TraitView from "./TraitView";
import { useRouter } from "next/router";
import { ELEMENTS_PER_PAGE } from "../../utils/app-settings";

const NFTTraitsList = ({ CID }: { CID: string }) => {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const allTraitsQuery = trpc.ipfs.getTraits.useQuery(CID);

  const startIndex = (page - 1) * ELEMENTS_PER_PAGE;
  const endIndex = page * ELEMENTS_PER_PAGE;

  const routerPage = router.query["page"];
  if (routerPage != undefined && parseInt(routerPage! as string) != page) {
    console.log(routerPage);
    setPage(parseInt(routerPage! as string));
  }

  const allTraits: Trait[] = allTraitsQuery.data?.traits ?? [];

  if (allTraitsQuery.isLoading) return <div> Loading... </div>;

  const paginatedTraits = allTraits.slice(startIndex, endIndex);

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
