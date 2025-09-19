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
  .add('texture.png')    // Returns PixiJS Texture
  .add('sky.hdr');       // Returns Three.js DataTexture

await resources.load();

const model = resources.get('model');     // Typed as GLTF
const texture = resources.get('texture'); // Typed as PixiJS Texture
const envMap = resources.get('sky');      // Typed as DataTexture
```
