import { readFile } from "node:fs/promises";

const headers = {
  accept: "application/expo+json",
  "expo-platform": "ios",
};

const localResponse = await fetch("http://127.0.0.1:8081", {
  headers,
  signal: AbortSignal.timeout(5_000),
});
if (!localResponse.ok) process.exit(1);

const tunnelUrl = (await readFile("/tmp/expo-tunnel-url", "utf8")).trim();
if (!/^https:\/\/[a-z0-9.-]+\.on\.expo\.app$/.test(tunnelUrl)) process.exit(1);

const tunnelResponse = await fetch(tunnelUrl, {
  headers,
  signal: AbortSignal.timeout(8_000),
});
process.exit(tunnelResponse.ok ? 0 : 1);
