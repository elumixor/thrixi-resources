import type { Texture as PixiTexture } from "pixi.js";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

/** Map file extensions to resource types */
export const extensionMap = {
  glb: "model",
  gltf: "model",
  png: "texture",
  jpg: "texture",
  jpeg: "texture",
  webp: "texture",
} as const;

/** Map file extensions to resource types */
export type ExtensionToType = typeof extensionMap;
/**
 * Supported resource types based on file extensions
 */
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
}

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
 * Resource entry with metadata
 */
export interface ResourceEntry<T extends SupportedFileName = SupportedFileName> {
  filename: T;
  name: RemoveExtension<T>;
  type: GetResourceType<T>;
  resource?: GetResourceObject<T>;
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
  current: { name: string; resource: GLTF | PixiTexture };
}
