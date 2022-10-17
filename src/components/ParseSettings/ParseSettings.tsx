import React from "react";
import { trpc } from "../../utils/trpc";
import { ThreeDots } from "react-loader-spinner";

const inputClassSet =
  " disabled:bg-gray-400 block rounded-md border border-slate-300 bg-white py-1 pl-2 pr-1 text-slate-900 shadow-sm placeholder:italic placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-1 sm:text-sm";

const ParseSettings = ({
  parseStateHandler,
}: {
  parseStateHandler: (parsedCID: string, parsedSupply: number) => void;
}) => {
  // Reload UI when traits list received
  const utils = trpc.useContext();

  // Starting point:
  // We need to parse ipfs info with contractAddress of collection
  // on Success need to start parsing metadata from IPFS, then show it
  const mutationGetIPFSInfoAndParse = trpc.evm.getIPFSInfo.useMutation({
    onSuccess: (ipfsInfo) => {
      utils.ipfs.getTraits.invalidate();
      parseStateHandler(ipfsInfo.CID, ipfsInfo.totalSupply);
    },
  });

  // Mutation for cancelling all requests immediately
  // on Success need to reset abort controller
  const mutationCancelParse = trpc.ipfs.cancelParse.useMutation({
    onSuccess: () => {
      utils.ipfs.getTraits.invalidate();
      mutationResetAbortController.mutateAsync();
    },
  });

  // Mutation for resetting abort controller, to be able cancel requests again
  // Mutation, because it's only working correct when all requests are done cancelling
  const mutationResetAbortController =
    trpc.ipfs.resetAbortController.useMutation();

  // Submit form with only contract address for NFT
  const handleForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form: HTMLFormElement = event.target as HTMLFormElement;
    mutationGetIPFSInfoAndParse.mutateAsync(form.contractAddress.value);
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
            disabled={
              mutationGetIPFSInfoAndParse.isLoading ||
              mutationResetAbortController.isLoading
            }
          />
        </div>

        <div className="flex flex-row justify-between">
          <button
            type="submit"
            disabled={
              mutationGetIPFSInfoAndParse.isLoading ||
              mutationResetAbortController.isLoading
            }
            className=" h-8 w-full  rounded-md bg-amber-600 py-1 px-2 text-center text-sm disabled:bg-gray-600 sm:w-20"
          >
            {mutationGetIPFSInfoAndParse.isLoading ? (
              <div className="flex items-center justify-center">
                <ThreeDots
                  height="24"
                  width="50"
                  radius="10"
                  color="#FFF"
                  visible={true}
                />
              </div>
            ) : (
              "PARSE"
            )}
          </button>
          {(mutationGetIPFSInfoAndParse.isLoading ||
            mutationResetAbortController.isLoading) && (
            <button
              onClick={() => mutationCancelParse.mutate()}
              className="ml-1 h-8 w-8 rounded-md bg-red-600 py-1 px-2 text-center text-sm sm:w-20"
            >
              X
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default ParseSettings;
