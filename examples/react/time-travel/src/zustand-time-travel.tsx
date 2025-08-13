import { useEffect, useState } from "react";
import { eventClient } from "./zustand-client";

export function ZustandTimeTravel() {
  const [snapshots, setSnapshots] = useState<Array<any>>([]);

  useEffect(() => {

    const cleanup = eventClient.on("stateChange", (event) => setSnapshots((prev) => [...prev, event.payload]));
    return () => {
      cleanup();
    };
  }, []);

  return (
    <div>
      {/* Snapshot slider to change the current state */}
      Drag Me to time travel through zustand states
      <hr />
      <input
        type="range"
        min={0}
        max={snapshots.length - 1}
        onChange={(e) => {
          const index = Number(e.target.value);
          eventClient.emit("revertSnapshot", snapshots[index]);
        }}
      />
    </div>
  );
}
