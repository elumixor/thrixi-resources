import type { Texture } from "pixi.js";
import { Assets } from "pixi.js";
import type { DataTexture } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";

/**
 * Base class for resource loaders
 */
export interface Loader<T extends GLTF | Texture | DataTexture = GLTF | Texture | DataTexture> {
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

/**
 * Loader for HDR environment maps using RGBELoader
 */
export class EnvironmentLoader implements Loader<DataTexture> {
  private readonly loader = new HDRLoader();

  load(path: string): Promise<DataTexture> {
    return new Promise<DataTexture>((resolve, reject) => {
      this.loader.load(
        path,
        (texture) => resolve(texture),
        undefined,
        (error) => reject(error),
      );
    });
  }
}

export const loaders = {
  model: new ModelLoader(),
  texture: new TextureLoader(),
  environment: new EnvironmentLoader(),
} as const;
