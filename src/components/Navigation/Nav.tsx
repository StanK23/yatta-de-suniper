import React from "react";

const Nav = () => {
  return (
    <nav className="flex w-full justify-between py-4 px-6 text-lg font-medium dark:bg-slate-900">
      <div className="">
        <h1 className="flex h-full items-center text-center align-middle">
          NFT Metadata parser
        </h1>
      </div>

      <div>
        <button className="rounded-md bg-amber-600 py-1 px-2 text-sm">
          Connect
        </button>
      </div>
    </nav>
  );
};

export default Nav;
