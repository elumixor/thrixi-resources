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

test("getLazy returns a promise that resolves to the resource", async () => {
  setUpProgressEventPolyfill();

  const assetsDir = join(process.cwd(), "test", "assets");
  const server = await createTestServer(assetsDir);
  const baseURL = `http://localhost:${server.port}`;

  const resources = new Resources(baseURL).add("portal.glb");

  // getLazy before loading should return a promise
  const lazyPromise = resources.getLazy("portal");
  expect(lazyPromise).toBeInstanceOf(Promise);

  // Load the resources
  const loadPromise = resources.load();

  // getLazy should resolve to the same resource as get()
  const [lazyResult, loadedResult] = await Promise.all([lazyPromise, loadPromise.then(() => resources.get("portal"))]);
  expect(lazyResult).toBe(loadedResult);

  server.stop();
});

test("getLazy resolves immediately if resource is already loaded", async () => {
  setUpProgressEventPolyfill();

  const assetsDir = join(process.cwd(), "test", "assets");
  const server = await createTestServer(assetsDir);
  const baseURL = `http://localhost:${server.port}`;

  const resources = new Resources(baseURL).add("portal.glb");

  await resources.load();

  // getLazy after loading should resolve immediately
  const lazyPromise = resources.getLazy("portal");
  expect(lazyPromise).toBeInstanceOf(Promise);

  const result = await lazyPromise;
  expect(result).toBe(resources.get("portal"));

  server.stop();
});
