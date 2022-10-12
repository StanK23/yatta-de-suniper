import React from "react";
import { trpc } from "../../utils/trpc";

const ParseSettings = () => {
  const parseMetadata = trpc.ipfs.metadata.useMutation();

  return (
    <div className="m-2 flex justify-between rounded-lg bg-slate-700 p-3">
      <input
        className="mr-3 block w-4/5 rounded-md border border-slate-300 bg-white py-2 pl-3 pr-3 text-slate-900 shadow-sm placeholder:italic placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-1 sm:text-sm"
        placeholder="Paste IPFS ID"
        type="text"
        name="ipfs"
      />
      <button
        onClick={() => parseMetadata.mutate()}
        className="w-1/5 rounded-md bg-amber-600 py-1 px-2 text-sm"
      >
        Parse
      </button>
    </div>
  );
};

export default ParseSettings;
