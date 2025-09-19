# Thrixi Resources

[![Build](https://github.com/elumixor/thrixi-resources/actions/workflows/build.yml/badge.svg)](https://github.com/elumixor/thrixi-resources/actions/workflows/build.yml)
[![Latest NPM version](https://img.shields.io/npm/v/@elumixor/thrixi-resources.svg)](https://www.npmjs.com/package/@elumixor/thrixi-resources)

Type-safe resource management for Three.js + PixiJS projects.

## Supported File Types

- **3D Models**: `.glb`, `.gltf` - Loaded using Three.js GLTFLoader
- **Textures**: `.png`, `.jpg`, `.jpeg`, `.webp` - Loaded using PixiJS Assets
- **Environment Maps**: `.hdr` - Loaded using Three.js RGBELoader for high dynamic range environment maps

## Usage

```typescript
import { Resources } from '@elumixor/thrixi-resources';

const resources = new Resources('/path/to/assets')
  .add('model.glb')      // Returns GLTF object
  .add('texture.png')    // Returns PixiJS Texture (default)
  .add('texture.jpg', 'three')  // Returns Three.js Texture
  .add('sky.hdr');       // Returns Three.js DataTexture

await resources.load();

const model = resources.get('model');     // Typed as GLTF
const pixiTexture = resources.get('texture'); // Typed as PixiJS Texture
const threeTexture = resources.get('texture'); // Typed as Three.js Texture (engine-dependent)
const envMap = resources.get('sky');      // Typed as DataTexture
```

## Engine Support

For texture files (`.png`, `.jpg`, `.jpeg`, `.webp`), you can specify which engine to use for loading:

- `"pixi"` (default): Uses PixiJS Assets loader, returns PixiJS Texture
- `"three"`: Uses Three.js TextureLoader, returns Three.js Texture

```typescript
// PixiJS texture (default)
resources.add('image.png');
resources.add('image.png', 'pixi');

// Three.js texture
resources.add('image.png', 'three');
```

### Type Safety

The library provides full type safety with engine-aware type inference:

```typescript
const resources = new Resources('/assets')
  .add('diffuse.png', 'pixi')   // PixiJS Texture
  .add('normal.png', 'three');  // Three.js Texture

await resources.load();

const pixiTexture = resources.get('diffuse');  // Type: PixiJS Texture
const threeTexture = resources.get('normal');  // Type: Three.js Texture

// TypeScript will enforce correct usage:
pixiTexture.baseTexture;  // ✓ Valid - PixiJS Texture property
threeTexture.isTexture;   // ✓ Valid - Three.js Texture property
// pixiTexture.isTexture; // ✗ Error - not available on PixiJS Texture
```
