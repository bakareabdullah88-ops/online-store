import "fake-indexeddb/auto";

// Keep the simulated network latency out of unit tests.
process.env.NEXT_PUBLIC_MOCK_LATENCY = "0";

// jsdom has no matchMedia; behave like a desktop browser with a mouse.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
