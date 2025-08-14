import { createEffect, onCleanup, } from "solid-js";

type Events = HTMLElementEventMap & WindowEventMap & DocumentEventMap & MediaQueryListEventMap;

type ListenerElements = Document | HTMLElement | MediaQueryList | Window;


export const useWindowListener = <TEvent extends keyof WindowEventMap>(
  type: TEvent,
  handler: (event: WindowEventMap[TEvent]) => void,
  options?: boolean | AddEventListenerOptions
) => useEventListener(typeof window !== "undefined" ? window : undefined, type, handler, options);


const useEventListener = <
  TEvent extends Events[keyof Events],
  TType extends keyof Pick<Events, { [K in keyof Events]: Events[K] extends TEvent ? K : never }[keyof Events]>
>(
  element: ListenerElements | undefined,
  type: TType,
  handler: (event: Events[TType]) => void,
  options?: AddEventListenerOptions | boolean
) => {
  let savedHandler = handler;

  createEffect(() => {
    savedHandler = handler;
  });

  createEffect(() => {
    if (!element) return;
    const listener: EventListenerOrEventListenerObject = event => savedHandler(event as never);

    element.addEventListener(type, listener, options);
    onCleanup(() => {
      element.removeEventListener(type, listener, options);
    });
  });
};
