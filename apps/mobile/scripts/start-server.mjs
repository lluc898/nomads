import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

const tunnelFile = process.env.EXPO_TUNNEL_FILE ?? "/tmp/expo-tunnel-url";
const checkIntervalMs = 20_000;
const maxFailures = 3;
const startupDeadline = Date.now() + 120_000;

let tunnelUrl = null;
let failures = 0;
let outputBuffer = "";
let stopping = false;

await writeFile(tunnelFile, "");

const expo = spawn(
  "pnpm",
  ["exec", "expo", "start", "--go", "--tunnel", "--port", "8081"],
  { env: process.env, stdio: ["inherit", "pipe", "pipe"] },
);

for (const stream of [expo.stdout, expo.stderr]) {
  stream.on("data", (chunk) => {
    process.stdout.write(chunk);
    inspectOutput(chunk.toString());
  });
}

expo.on("exit", (code, signal) => {
  if (!stopping) {
    console.error(`Expo se ha detenido (${signal ?? code ?? "desconocido"}).`);
  }
  process.exit(code ?? (signal ? 1 : 0));
});

expo.on("error", (error) => {
  console.error("No se ha podido iniciar Expo.", error);
  process.exit(1);
});

const watchdog = setInterval(async () => {
  if (!tunnelUrl) {
    if (Date.now() > startupDeadline)
      failServer("Expo no ha publicado un túnel a tiempo.");
    return;
  }

  try {
    const response = await fetch(tunnelUrl, {
      headers: {
        accept: "application/expo+json",
        "expo-platform": "ios",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    failures = 0;
  } catch (error) {
    failures += 1;
    console.error(
      `El túnel público de Expo no responde (${failures}/${maxFailures}).`,
      error instanceof Error ? error.message : error,
    );
    if (failures >= maxFailures)
      failServer("Reiniciando Expo para recuperar el túnel público.");
  }
}, checkIntervalMs);

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => stopServer(signal));
}

function inspectOutput(output) {
  outputBuffer = `${outputBuffer}${output}`.slice(-8_000);
  const cleanOutput = outputBuffer.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "");
  const matches = [
    ...cleanOutput.matchAll(/https?:\/\/([a-z0-9.-]+\.on\.expo\.app)/gi),
  ];
  const hostname = matches.at(-1)?.[1];
  if (!hostname) return;

  const nextUrl = `https://${hostname}`;
  if (nextUrl === tunnelUrl) return;
  tunnelUrl = nextUrl;
  failures = 0;
  writeFile(tunnelFile, `${tunnelUrl}\n`).catch((error) => {
    console.error("No se ha podido registrar la URL del túnel.", error);
  });
  console.log(`Watchdog conectado a ${tunnelUrl}`);
}

function failServer(message) {
  console.error(message);
  stopServer("SIGTERM", 1);
}

function stopServer(signal, exitCode = 0) {
  if (stopping) return;
  stopping = true;
  clearInterval(watchdog);
  expo.kill(signal);
  setTimeout(() => process.exit(exitCode), 3_000).unref();
}
