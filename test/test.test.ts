import { expect, test } from "bun:test";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { Resources } from "../src";
import { createTestServer, setUpProgressEventPolyfill } from "./test-utils";

// Setup helper
async function setupTestServer() {
  setUpProgressEventPolyfill();
  const assetsDir = join(process.cwd(), "test", "assets");
  const files = await readdir(assetsDir);
  expect(files).toContain("portal.glb");
  const server = await createTestServer(assetsDir);
  const baseURL = `http://localhost:${server.port}`;
  return { server, baseURL, assetsDir };
}

test("Resources basic functionality", async () => {
  const { server, baseURL } = await setupTestServer();

  const empty = new Resources(baseURL);

  // Test missing resource error
  expect(() => {
    // @ts-expect-error missing not added
    empty.get("missing");
  }).toThrowError("Resource 'missing' not found. Did you add it to the resources?");

  // Test unsupported extension error
  expect(() => {
    // @ts-expect-error unsupported extension
    empty.add("invalid.txt");
  }).toThrowError("Unsupported file extension: .txt");

  // Test adding and getting before load
  const withModel = empty.add("portal.glb");
  expect(() => {
    withModel.get("portal");
  }).toThrowError("Resource 'portal' not loaded yet. Call load() first.");

  // Test loading and getting
  await expect(withModel.load()).resolves.toBeUndefined();
  const gltf = withModel.get("portal");
  expect(gltf).toBeDefined();

  server.stop();
});

test("Resources supports both chaining and separate add calls", async () => {
  const { server, baseURL } = await setupTestServer();

  // Test chaining
  const chained = new Resources(baseURL).add("portal.glb");

  expect(chained.names).toContain("portal");
  expect(chained.names).toHaveLength(1);

  // Test separate calls on same instance
  let separate = new Resources(baseURL);
  separate = separate.add("portal.glb") as unknown as typeof separate;

  expect(separate.names).toContain("portal");
  expect(separate.names).toHaveLength(1);

  // Both should work identically
  await expect(chained.load()).resolves.toBeUndefined();
  await expect(separate.load()).resolves.toBeUndefined();

  const chainedGltf = chained.get("portal");
  const separateGltf = (separate as unknown as typeof chained).get("portal");
  expect(chainedGltf).toBeDefined();
  expect(separateGltf).toBeDefined();

  server.stop();
});

test("getLazy returns a promise that resolves to the resource", async () => {
  const { server, baseURL } = await setupTestServer();

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
  const { server, baseURL } = await setupTestServer();

  const resources = new Resources(baseURL).add("portal.glb");

  await resources.load();

  // getLazy after loading should resolve immediately
  const lazyPromise = resources.getLazy("portal");
  expect(lazyPromise).toBeInstanceOf(Promise);

  const result = await lazyPromise;
  expect(result).toBe(resources.get("portal"));

  server.stop();
});
