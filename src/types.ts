import type { Texture as PixiTexture } from "pixi.js";
import type { DataTexture, Texture as ThreeTexture } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

/** Map file extensions to resource types */
export const extensionMap = {
  glb: "model",
  gltf: "model",
  png: "texture",
  jpg: "texture",
  jpeg: "texture",
  webp: "texture",
  hdr: "environment",
  json: "json",
} as const;

/** Recursive JSON value type */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Map file extensions to resource types */
export type ExtensionToType = typeof extensionMap;
export type ResourceType = ExtensionToType[keyof ExtensionToType];
//           ^?
export type Extension = keyof ExtensionToType;
//           ^?
export type SupportedFileName = `${string}.${Extension}`;

/**
 * Map resource types to their loaded objects
 */
export interface TypeToResource {
  model: GLTF;
  texture: PixiTexture;
  environment: DataTexture;
  json: JsonValue;
}

/**
 * Engine-specific resource type mapping
 */
export interface EngineToResourceType {
  pixi: {
    model: GLTF;
    texture: PixiTexture;
    environment: DataTexture;
    json: JsonValue;
  };
  three: {
    model: GLTF;
    texture: ThreeTexture;
    environment: DataTexture;
    json: JsonValue;
  };
}

/**
 * Get the resource object type based on filename and engine
 */
export type GetResourceObjectByEngine<
  T extends SupportedFileName,
  E extends Engine = "pixi",
> = GetResourceType<T> extends keyof EngineToResourceType[E] ? EngineToResourceType[E][GetResourceType<T>] : never;

/** Extract filename without extension. block.png -> block */
export type RemoveExtension<T extends SupportedFileName> = T extends `${infer Name}.${string}` ? Name : T;
/** Extract file extension from filename. block.png -> png */
export type GetExtension<T extends SupportedFileName> = T extends `${string}.${infer Ext}` ? Ext : never;

/**
 * Get resource type from filename
 */
export type GetResourceType<T extends SupportedFileName> = GetExtension<T> extends keyof ExtensionToType
  ? ExtensionToType[GetExtension<T>]
  : never;

/**
 * Get the loaded resource object type from filename
 */
export type GetResourceObject<T extends SupportedFileName> = GetResourceType<T> extends keyof TypeToResource
  ? TypeToResource[GetResourceType<T>]
  : never;

/**
 * Supported engines for resource loading
 */
export type Engine = "three" | "pixi";

/**
 * Resource entry with metadata
 */
export interface ResourceEntry<T extends SupportedFileName = SupportedFileName, E extends Engine = "pixi"> {
  filename: T;
  name: RemoveExtension<T>;
  type: GetResourceType<T>;
  engine: E;
  resource?: GetResourceObjectByEngine<T, E>;
  path: string;
  loaded: boolean;
}

/**
 * Loading progress information
 */
export interface LoadingProgress {
  total: number;
  loaded: number;
  percentage: number;
  current: { name: string; resource: GLTF | PixiTexture | DataTexture | ThreeTexture | JsonValue };
}
