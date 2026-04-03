import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import type { NextConfig } from "next";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default function createNextConfig(phase: string): NextConfig {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    outputFileTracingRoot: projectRoot,
    typedRoutes: true,
    // Keep dev artifacts isolated so build/cleanup operations do not break a running dev server.
    distDir: isDevServer ? ".next-dev" : ".next",
  };
}
