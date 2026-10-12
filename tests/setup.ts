import "fake-indexeddb/auto";

// Keep the simulated network latency out of unit tests.
process.env.NEXT_PUBLIC_MOCK_LATENCY = "0";
