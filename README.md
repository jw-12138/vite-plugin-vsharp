# VSharp - A Vite Plugin for Compressing Static Images with [Sharp.js](https://www.npmjs.com/package/sharp)

> 

[vsharp](https://github.com/jw-12138/vite-plugin-vsharp) is a plugin for [Vite](https://github.com/vitejs/vite), it allows you to compress static images after each build, using the powerful Sharp.js library. It is a great way to reduce the size of your images and improve the performance of your website or application. With VSharp, you can easily optimize the size of your images without sacrificing quality.

```text
> npx vite build

vite v2.6.14 
✓ 1 modules transformed.
Generated an empty chunk: "index"
dist/index.html   0.30 KiB
vsharp: [dist/img/2_1.1.2.jpg] 725 KB <<-80.38%>> 142 KB
vsharp: [dist/exclude_img/2_1.1.2.jpg] 725 KB <<-80.38%>> 142 KB
vsharp: [dist/img/001.jpg] 1.1 MB <<-81.67%>> 215 KB
vsharp: [dist/exclude_img/001.jpg] 1.1 MB <<-81.67%>> 215 KB
vsharp: [dist/img/times.png] 4.0 MB <<-72.98%>> 1.1 MB
```

## ⚠️⚠️⚠️ For Vite 4 Users

Looks like Vite 4 bundles things differently than previous versions, the filename will be like `<filename>-<hash>.<ext>` instead of `<filename>.<hash>.<ext>`, and this will affect the `exclude` option of this plugin (see https://github.com/jw-12138/vite-plugin-vsharp/issues/7). To resolve this problem, One option is to downgrade Vite to version 3 (`npm i vite@3`), and another is to add a little config in your `vite.config.js`: 

```javascript
import vsharp from "vite-plugin-vsharp"
export default ({
  // ⬇️ from here
  build: {
    rollupOptions: {
      output: {
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  },
  // ⬆️ to here
  plugins: [
    vsharp()
  ]
})
```

--- 

Currently supported file types are:

- `.jpg/.jpeg`
- `.png`
- `.gif`
- `.webp`

Currently supported sharp functions are:

- `sharp().jpeg()` [docs for this function](https://sharp.pixelplumbing.com/api-output#jpeg)
- `sharp().png()` [docs for this function](https://sharp.pixelplumbing.com/api-output#png)
- `sharp().gif()` [docs for this function](https://sharp.pixelplumbing.com/api-output#gif)
- `sharp().webp()` [docs for this function](https://sharp.pixelplumbing.com/api-output#webp)

## Installation

```bash
npm i vite-plugin-vsharp -D
```

## Usage

```javascript
// vite.config.js

import vsharp from "vite-plugin-vsharp"

export default ({
  plugins: [
    vsharp()
  ]
})
```

## Options

1. `exclude {Object[]?}`  
   
   This option will exclude image files **only** in bundle processing. Since `Vite` bundles images just in one folder, there
   is **no need** for you to add any prefix to the pathname. No wildcard glob support for now.
   
   ```json5
   {
     "exclude": [
       "bg.jpg", // good
       "assets/bg.jpg", // bad
       "bg.<hash>.jpg", // bad
     ]
   }
   ```

2. `excludePublic {Object[]?}` 

   This option will exclude image files in the public folder, glob pattern is supported. For this option, you'll need to add prefix according to your root path and configurations. `Vite` uses `public` as default public folder.

   ```json5
   {
     "excludePublic": [
       "public/test_img/*"
     ]
   }
   ```
   
3. `includePublic{Object[]?}` 

   This option will include images from a previously excluded folder, it has a higher priority than `excludePublic` and will always overwrite `excludePublic` option.

   ```json5
   {
     "includePublic": [
       "public/test_img/001.jpg"
     ]
   }
   ```
   
4. Resize

   - width
   - height
   - scale (will overwrite `width` and `height`). 

   ```json
   {
     "width": 800,
     "height": 800,
     "scale": 0.8
   }
   ```



## Defaults

```json
{
  "includePublic": [
  ],
  "excludePublic": [
  ],
  "exclude": [
  ],
  ".jpg": {
    "quality": 80
  },
  ".jpeg": {
    "quality": 80
  },
  ".png": {
    "quality": 80,
    "palette": true
  },
  ".webp": {
    "lossless": true
  }
}
```

Every other parameter in currently supported sharp functions by this plugin can be found
on [the official sharp docs](https://sharp.pixelplumbing.com/api-constructor).
