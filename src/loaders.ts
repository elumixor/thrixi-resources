import type { Texture } from "pixi.js";
import { Assets } from "pixi.js";
import type { DataTexture, Texture as ThreeTexture } from "three";
import { TextureLoader as ThreeTextureLoaderCore } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import type { JsonValue } from "./types";

/**
 * Base class for resource loaders
 */
export interface Loader<
  T extends GLTF | Texture | DataTexture | ThreeTexture | JsonValue =
    | GLTF
    | Texture
    | DataTexture
    | ThreeTexture
    | JsonValue,
> {
  load(path: string): Promise<T>;
}

/**
 * Loader for 3D models (GLTF/GLB)
 */
export class ModelLoader implements Loader<GLTF> {
  private readonly loader = new GLTFLoader();

  load(path: string): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error),
      );
    });
  }
}

/** Loader for 2D textures using Pixi.js Assets */
export class TextureLoader implements Loader<Texture> {
  load(path: string): Promise<Texture> {
    return Assets.load(path);
  }
}

/** Loader for 2D textures using Three.js TextureLoader */
export class ThreeTextureLoader implements Loader<ThreeTexture> {
  private readonly loader = new ThreeTextureLoaderCore();

  load(path: string): Promise<ThreeTexture> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (loadedTexture: ThreeTexture) => resolve(loadedTexture),
        undefined,
        (error: unknown) => reject(error),
      );
    });
  }
}

/**
 * Loader for HDR environment maps using HDRLoader
 */
export class EnvironmentLoader implements Loader<DataTexture> {
  private readonly loader = new HDRLoader();

  load(path: string): Promise<DataTexture> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (texture: DataTexture) => resolve(texture),
        undefined,
        (error: unknown) => reject(error),
      );
    });
  }
}

/** Loader for JSON files using Pixi.js Assets */
export class JsonLoader implements Loader<JsonValue> {
  load(path: string): Promise<JsonValue> {
    return Assets.load(path);
  }
}

export const loaders = {
  model: new ModelLoader(),
  texture: new TextureLoader(),
  environment: new EnvironmentLoader(),
  json: new JsonLoader(),
} as const;

export const threeLoaders = {
  model: new ModelLoader(),
  texture: new ThreeTextureLoader(),
  environment: new EnvironmentLoader(),
  json: new JsonLoader(),
} as const;
