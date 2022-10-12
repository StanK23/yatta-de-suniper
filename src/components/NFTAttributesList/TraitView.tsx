import React from "react";
import { Trait } from "../../utils/services/IPFSService";

const TraitView = ({ trait }: { trait: Trait }) => {
  return (
    <div className="m-1 flex flex-row justify-between rounded-md border bg-slate-600">
      <div className="p-2">
        {trait.type}: {trait.title}
      </div>
      <div className="p-2">{trait.count}</div>
    </div>
  );
};

export default TraitView;
