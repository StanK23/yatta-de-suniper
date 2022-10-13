import React from "react";
import { trpc } from "../../utils/trpc";

const inputClassSet =
  "block rounded-md border border-slate-300 bg-white py-1 pl-2 pr-1 text-slate-900 shadow-sm placeholder:italic placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-1 sm:text-sm";

const ParseSettings = ({
  parseStateHandler,
}: {
  parseStateHandler: (parsedCID: string, parsedSupply: number) => void;
}) => {
  // Reload UI when traits list received
  const utils = trpc.useContext();
  const parseMetadata = trpc.ipfs.parseMetadata.useMutation({
    onSuccess: () => {
      utils.ipfs.getTraits.invalidate();
    },
  });

  // Parse Metadata mutation
  const handleForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let CID = event.target.CID.value;
    let supply = parseInt(event.target.supply.value);

    parseMetadata.mutate({
      CID: CID,
      supply: supply,
      contractAddress: event.target.contractAddress.value,
    });

    parseStateHandler(CID, supply);
  };

  return (
    <form action="/" onSubmit={(event) => handleForm(event)}>
      <div className="m-2 flex flex-col justify-between gap-2 rounded-lg bg-slate-700 p-2 sm:flex-row">
        <div className="flex flex-grow justify-between gap-1 rounded-lg bg-slate-700">
          <input
            className={inputClassSet + " flex-grow invalid:border-red-600"}
            placeholder="0x..."
            type="text"
            name="contractAddress"
            required
          />
          <input
            className={inputClassSet + " w-28 invalid:border-red-600"}
            placeholder="IPFS ID"
            type="text"
            name="CID"
            required
          />
          <input
            className={inputClassSet + " w-20 invalid:border-red-600"}
            placeholder="Supply"
            min={1}
            type="number"
            name="supply"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-amber-600 py-1 px-2 text-sm sm:w-20"
        >
          Parse
        </button>
      </div>
    </form>
  );
};

export default ParseSettings;
