import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import Nav from "../components/Navigation/Nav";
import NFTTraitsList from "../components/NFTAttributesList/NFTTraitsList";
import Pagination from "../components/NFTAttributesList/Pagination";
import ParseSettings from "../components/ParseSettings/ParseSettings";
import { Trait } from "../utils/services/IPFSService";
import { ELEMENTS_PER_PAGE } from "../utils/app-settings";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const [CID, setCID] = useState("");
  const [totalSupply, setTotalSupply] = useState(0);

  const handleParseState = (parsedCID: string, parsedTotalSupply: number) => {
    setCID(parsedCID);
    setTotalSupply(parsedTotalSupply);
  };

  const allTraitsQuery = trpc.ipfs.getTraits.useQuery(CID);
  const allTraits: Trait[] = allTraitsQuery.data?.traits ?? [];

  return (
    <>
      <Head>
        <title>YattaDeSuniper - NFT Metadata parser</title>
        <meta name="description" content="NFT Parser directly from IPFS" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Nav></Nav>
      <ParseSettings parseStateHandler={handleParseState} />
      <NFTTraitsList CID={CID}></NFTTraitsList>
      {allTraits.length > ELEMENTS_PER_PAGE && (
        <Pagination traitsCount={allTraits.length} />
      )}
    </>
  );
};

export default Home;
