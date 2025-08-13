import { EventClient } from "@tanstack/devtools-event-client";
import { createStore, } from "zustand";

interface ZustandEventMap {
  "zustand:stateChange": any;
  "zustand:revertSnapshot": any;
}
export const eventClient = new EventClient<ZustandEventMap>({
  pluginId: "zustand"
});

export const store = createStore<{
  count: number;
  increment: () => void;
  decrement: () => void;
}>((set) => ({
  count: 0,
  increment: () => {
    return set((state) => {
      eventClient.emit("stateChange", { count: state.count + 1 });
      return { count: state.count + 1 }
    })
  },
  decrement: () => {
    return set((state) => {
      eventClient.emit("stateChange", { count: state.count - 1 });
      return { count: state.count - 1 }
    })
  },
}));

eventClient.on("revertSnapshot", (snapshot) => {
  store.setState({
    count: snapshot.payload.count
  });
});
