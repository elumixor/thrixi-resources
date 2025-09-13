import { type Loader, loaders } from "./loaders";
import {
  extensionMap,
  type GetExtension,
  type GetFileName,
  type GetResourceObject,
  type GetResourceType,
  type LoadingProgress,
  type ResourceEntry,
  type SupportedFileName,
} from "./types";

/**
 * Type-safe resource management system with fluent API
 */
export class Resources<TResources extends Record<string, ResourceEntry> = Record<never, never>> {
  private readonly basePath: string;

  constructor(
    basePath: string,
    private readonly resources: TResources = {} as TResources,
  ) {
    // Normalize basePath: remove trailing slashes
    this.basePath = basePath.replace(/\/+$/, "");
  }

  /**
   * Add a resource to be loaded
   * @param filename The filename with extension (e.g., 'portal.glb', 'image.png')
   * @returns A new Resources instance with the added resource
   */
  add<T extends SupportedFileName>(filename: T): Resources<TResources & { [K in GetFileName<T>]: ResourceEntry<T> }> {
    const dotIndex = filename.lastIndexOf(".");
    const name = (dotIndex > 0 ? filename.substring(0, dotIndex) : filename) as GetFileName<T>;
    const extension = filename.substring(filename.lastIndexOf(".") + 1) as GetExtension<T>;
    const type = extensionMap[extension] as GetResourceType<T>;
    if (!type) throw new Error(`Unsupported file extension: .${extension}`);

    const newEntry: ResourceEntry<T> = {
      name,
      filename,
      type,
      path: `${this.basePath}/${filename}`,
      loaded: false,
    };

    const newResources = {
      ...this.resources,
      [name]: newEntry,
    } as TResources & {
      [K in GetFileName<T>]: ResourceEntry<T>;
    };

    return new Resources(this.basePath, newResources);
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
  ): TResources[K] extends ResourceEntry<infer T> ? GetResourceObject<T> : never {
    const entry = this.resources[name];

    if (!entry) throw new Error(`Resource '${String(name)}' not found. Did you add it to the resources?`);

    if (!entry.loaded || !entry.resource)
      throw new Error(`Resource '${String(name)}' not loaded yet. Call load() first.`);

    return entry.resource as TResources[K] extends ResourceEntry<infer T> ? GetResourceObject<T> : never;
  }

  /**
   * Load all added resources
   * @param onProgress Optional progress callback
   */
  async load(onProgress?: (progress: LoadingProgress) => void): Promise<void> {
    const entries = Object.values(this.resources);
    const total = entries.length;
    let loaded = 0;

    const updateProgress = () => {
      onProgress?.({ total, loaded, percentage: total > 0 ? (loaded / total) * 100 : 100 });
    };

    updateProgress();

    await Promise.all(
      entries.map(async (entry) => {
        try {
          const loader = loaders[entry.type] as Loader;
          const resource = await loader.load(entry.path);

          entry.resource = resource;
          entry.loaded = true;

          loaded++;
          updateProgress();
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
  get progress(): LoadingProgress {
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
