import React from "react";
import { trpc } from "../../utils/trpc";

const inputClassSet =
  "mr-3 block w-4/5 rounded-md border border-slate-300 bg-white py-2 pl-3 pr-3 text-slate-900 shadow-sm placeholder:italic placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-1 sm:text-sm";

const ParseSettings = () => {
  // Reload UI when traits list received
  const utils = trpc.useContext();
  const parseMetadata = trpc.ipfs.parseMetadata.useMutation({
    onSuccess: () => {
      utils.ipfs.getTraits.invalidate();
    },
  });

  // Parse Metadata mutation
  const mutateMetadata = () =>
    parseMetadata.mutate({
      CID: "bafybeievpwedrt7soo6nbgkdttmjjmpkcsjkzpyaz4zox74fr45blo5boe",
      supply: 500,
    });

  return (
    <div className="m-2 flex justify-between rounded-lg bg-slate-700 p-3">
      <input
        className={inputClassSet}
        placeholder="Paste IPFS ID"
        type="text"
        name="ipfs"
      />
      <input
        className={inputClassSet + " w-28"}
        placeholder="Supply"
        min={1}
        type="number"
        name="supply"
      />
      <button
        onClick={mutateMetadata}
        className="w-1/5 rounded-md bg-amber-600 py-1 px-2 text-sm"
      >
        Parse
      </button>
    </div>
  );
};

export default ParseSettings;
