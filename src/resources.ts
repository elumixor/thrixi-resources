import type { Texture as PixiTexture } from "pixi.js";
import type { DataTexture, Texture as ThreeTexture } from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { type Loader, loaders, threeLoaders } from "./loaders";
import {
  type Engine,
  extensionMap,
  type GetExtension,
  type GetResourceObject,
  type GetResourceObjectByEngine,
  type GetResourceType,
  type JsonValue,
  type LoadingProgress,
  type RemoveExtension,
  type ResourceEntry,
  type SupportedFileName,
} from "./types";

/** Type-safe resource management system with fluent API */
export class Resources<TResources extends Record<string, ResourceEntry> = Record<never, never>> {
  private readonly basePath: string;
  private readonly events = new Map<
    string,
    Array<(resource: GLTF | PixiTexture | DataTexture | ThreeTexture | JsonValue) => void>
  >();

  constructor(
    basePath: string,
    private readonly resources: TResources = {} as TResources,
  ) {
    // Normalize basePath: remove trailing slashes
    this.basePath = basePath.replace(/\/+$/, "");
  }

  onLoaded(
    name: string,
    callback: (resource: GLTF | PixiTexture | DataTexture | ThreeTexture | JsonValue) => void,
  ): void {
    if (!this.events.has(name)) {
      this.events.set(name, []);
    }
    const listeners = this.events.get(name);
    if (listeners) {
      listeners.push(callback);
    }
  }

  private emitLoaded(name: string, resource: GLTF | PixiTexture | DataTexture | ThreeTexture | JsonValue): void {
    const listeners = this.events.get(name);
    if (listeners) {
      for (const callback of listeners) {
        callback(resource);
      }
      this.events.delete(name);
    }
  }

  /**
   * Add a resource to be loaded
   * @param filename The filename with extension (e.g., 'portal.glb', 'image.png')
   * @param engine The engine to use for loading (defaults to 'pixi' for textures)
   * @returns A new Resources instance with the added resource
   */
  add<T extends SupportedFileName, E extends Engine = "pixi">(
    filename: T,
    engine: E = "pixi" as E,
  ): Resources<TResources & { [K in RemoveExtension<T>]: ResourceEntry<T, E> }> {
    const dotIndex = filename.lastIndexOf(".");
    const name = (dotIndex > 0 ? filename.substring(0, dotIndex) : filename) as RemoveExtension<T>;
    const extension = filename.substring(filename.lastIndexOf(".") + 1) as GetExtension<T>;
    const type = extensionMap[extension] as GetResourceType<T>;
    if (!type) throw new Error(`Unsupported file extension: .${extension}`);

    const newEntry: ResourceEntry<T, E> = {
      name,
      filename,
      type,
      engine,
      path: `${this.basePath}/${filename}`,
      loaded: false,
    };

    // Update self
    this.resources[name] = newEntry as unknown as TResources[RemoveExtension<T>];

    return this as unknown as Resources<TResources & { [K in RemoveExtension<T>]: ResourceEntry<T, E> }>;
  }

  /** Get list of all resource names */
  get names(): (keyof TResources)[] {
    return Object.keys(this.resources);
  }

  /**
   * Get a loaded resource by name (without extension)
   * @param name The resource name (e.g., 'rock', 'image')
   * @returns The loaded resource object
   */
  get<K extends keyof TResources>(
    name: K,
  ): TResources[K] extends ResourceEntry<infer T, infer E> ? GetResourceObjectByEngine<T, E> : unknown {
    const entry = this.resources[name];

    if (!entry) throw new Error(`Resource '${String(name)}' not found. Did you add it to the resources?`);

    if (!entry.loaded || !entry.resource)
      throw new Error(`Resource '${String(name)}' not loaded yet. Call load() first.`);

    return entry.resource as TResources[K] extends ResourceEntry<infer T, infer E>
      ? GetResourceObjectByEngine<T, E>
      : never;
  }

  /**
   * Get a promise that resolves to the resource once it's loaded
   * @param name The resource name (e.g., 'rock', 'image')
   * @returns A promise that resolves to the loaded resource object
   */
  getLazy<K extends keyof TResources>(
    name: K,
  ): Promise<TResources[K] extends ResourceEntry<infer T, infer E> ? GetResourceObjectByEngine<T, E> : unknown> {
    const entry = this.resources[name];

    if (!entry) throw new Error(`Resource '${String(name)}' not found. Did you add it to the resources?`);

    if (entry.loaded && entry.resource) {
      return Promise.resolve(
        entry.resource as TResources[K] extends ResourceEntry<infer T, infer E>
          ? GetResourceObjectByEngine<T, E>
          : never,
      );
    }

    return new Promise((resolve) => {
      this.onLoaded(entry.name, (resource) => {
        resolve(
          resource as TResources[K] extends ResourceEntry<infer T, infer E> ? GetResourceObjectByEngine<T, E> : never,
        );
      });
    });
  }

  /**
   * Load all added resources
   * @param onProgress Optional progress callback
   */
  async load(onProgress?: (progress: LoadingProgress) => void): Promise<void> {
    const entries = Object.values(this.resources);
    const total = entries.length;
    let loaded = 0;

    const updateProgress = (
      entryName: string,
      resource: GLTF | PixiTexture | DataTexture | ThreeTexture | JsonValue,
    ) => {
      onProgress?.({
        total,
        loaded,
        percentage: total > 0 ? (loaded / total) * 100 : 100,
        current: { name: entryName, resource },
      });
    };

    await Promise.all(
      entries.map(async (entry) => {
        try {
          // Select the appropriate loader based on engine
          const engine = entry.engine as Engine;
          const loaderSet = engine === "three" ? threeLoaders : loaders;
          const loader = loaderSet[entry.type] as Loader;
          const resource = await loader.load(entry.path);

          entry.resource = resource as GetResourceObject<typeof entry.filename>;
          entry.loaded = true;

          this.emitLoaded(entry.name, resource);

          loaded++;
          updateProgress(entry.name, resource);
          return resource;
        } catch (error) {
          console.error(`Error loading resource '${entry.filename}':`, error);
          throw new Error(`Failed to load resource '${entry.filename}'`, { cause: error });
        }
      }),
    );
  }

  /**
   * Check if all resources are loaded
   */
  get isLoaded(): boolean {
    return Object.values(this.resources).every((entry) => entry.loaded);
  }

  /**
   * Get loading progress information
   */
  get progress() {
    const entries = Object.values(this.resources);
    const total = entries.length;
    const loaded = entries.filter((entry) => entry.loaded).length;

    return {
      total,
      loaded,
      percentage: total > 0 ? (loaded / total) * 100 : 100,
    };
  }
}
