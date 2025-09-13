import { expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { Resources } from "../src";
import { createTestServer, setUpProgressEventPolyfill } from "./test-utils";

test("Resources loader loads a GLB model via HTTP server in Bun", async () => {
  setUpProgressEventPolyfill();

  // Spin up a tiny static file server so that three's internal fetch(Request) works
  const assetsDir = join(process.cwd(), "test", "assets");

  // Basic sanity: assets directory contains portal.glb
  const files = await readdir(assetsDir);
  expect(files).toContain("portal.glb");

  const server = await createTestServer(assetsDir);

  const baseURL = `http://localhost:${server.port}`;

  const empty = new Resources(baseURL);

  expect(() => {
    // @ts-expect-error missing not added
    empty.get("missing");
  }).toThrowError("Resource 'missing' not found. Did you add it to the resources?");

  const withModel = empty.add("portal.glb");

  expect(() => {
    // @ts-expect-error unsupported extension
    withModel.add("invalid.txt");
  }).toThrowError("Unsupported file extension: .txt");

  expect(() => {
    withModel.get("portal");
  }).toThrowError("Resource 'portal' not loaded yet. Call load() first.");

  await expect(withModel.load()).resolves.toBeUndefined();

  const gltf = withModel.get("portal");
  expect(gltf).toBeDefined();

  server.stop();
});
