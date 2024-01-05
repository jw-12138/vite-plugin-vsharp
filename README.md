# VSharp: Optimize Images for the Web with Vite and Sharp

VSharp is a powerful Vite plugin that utilizes the formidable Sharp library to compress and optimize static images during your build process. This helps to significantly reduce image sizes, enhancing your website or application's load time and overall performance. With VSharp, maintaining high-quality images at smaller file sizes becomes an effortless part of your development workflow.

https://github.com/jw-12138/vite-plugin-vsharp/assets/29943110/9702e1c4-8283-4d97-aa20-3f6dccc32233

## Features

- Supported image formats: `.jpg/.jpeg`, `.png`, `.gif`, `.webp`.
- Integrates image compression features from Sharp's API, including `sharp().jpeg()`, `sharp().png()`, `sharp().gif()`, and `sharp().webp()` ([Sharp documentation](https://sharp.pixelplumbing.com/api-output)).

## Getting Started

### Installation

To install the plugin, run the following command:

```bash
npm install vite-plugin-vsharp --save-dev
```

### Configuration

Add VSharp to your Vite configuration file:

```javascript
// vite.config.js
import vsharp from 'vite-plugin-vsharp';

export default {
  plugins: [
    vsharp({
      // Plugin options go here
    }),
  ],
};
```

## Plugin Options

Customize the behavior of VSharp with the following options:

1. `exclude`: Specify which image files to skip during image bundling. Simple names without path prefixes are required.

   ```js
   // vite.config.js
   {
     // ...
     plugins: [
       vsharp({
         exclude: [
           "bg.jpg", // Includes "bg.jpg"
           // Do not add path prefixes or hashes
         ],
       }),
     ]
   }
   ```

2. `excludePublic`: Exclude images from the public directory using glob patterns. Prefixes relative to your project's root are necessary.

   ```js
   // vite.config.js
   {
     // ...
     plugins: [
       vsharp({
         excludePublic: [
           "public/test_img/*", // Exclude all images in public/test_img
         ],
       }),
     ]
   }
   ```

3. `includePublic`: Specifically include images from an excluded directory, overriding the `excludePublic` option.

   ```js
   // vite.config.js
   {
     // ...
     plugins: [
       vsharp({
         includePublic: [
           "public/test_img/001.jpg", // Include this particular image
         ],
       }),
     ]
   }
   ```

4. Resize options: Configure dimensions or scaling to resize images.

   ```js
   // vite.config.js
   {
     // ...
     plugins: [
       vsharp({
         width: 800,
         height: 800,
         scale: 0.8, // Overrides width and height
       }),
     ]
   }
   ```

5. Preserve Metadata: Maintain image metadata such as orientation.

   ```js
   // vite.config.js
   {
     // ...
     plugins: [
       vsharp({
         preserveMetadata: {
           orientation: true, // Preserves image orientation
         },
       }),
     ]
   }
   ```

## Default Settings

The plugin provides sensible defaults, which can be overridden by specifying your own settings in the plugin options:

```json
{
  "includePublic": [],
  "excludePublic": [],
  "exclude": [],
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
  },
  "preserveMetadata": {
    "orientation": false
  }
}
```

For additional Sharp function parameters, refer to the [official Sharp documentation](https://sharp.pixelplumbing.com/api-constructor).

----

Let VSharp take the weight off your shoulders by compressing your images seamlessly during the build process, and watch as your projects load faster than ever without compromising on image quality.
