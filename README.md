# VSharp: Simple Image Compression for Vite Projects

VSharp is a Vite plugin that makes image optimization easy. It uses the powerful Sharp library to automatically compress your images during the build process. This means faster-loading websites with high-quality images, all without any extra work on your part.

<img width="716" alt="image" src="https://github.com/jw-12138/vite-plugin-vsharp/assets/29943110/3e4b97f4-892c-47c0-b850-d1e0fc46b245">

## Features

- Works with common image formats: `.jpg/.jpeg`, `.png`, `.gif`, and `.webp`
- Uses Sharp's proven compression methods for each format type ([Sharp documentation](https://sharp.pixelplumbing.com/api-output))

## Getting Started

### Installation

Add VSharp to your project:

```bash
npm install vite-plugin-vsharp --save-dev
```

### Basic Setup

Add VSharp to your Vite config file:

```javascript
// vite.config.js
import vsharp from 'vite-plugin-vsharp';

export default {
  plugins: [
    vsharp({
      // Your options here
    }),
  ],
};
```

## Configuration Options

Here's how you can customize VSharp to fit your needs:

1. `exclude`: Skip specific images during compression. Just list the filenames:

   ```js
   // vite.config.js
   {
     plugins: [
       vsharp({
         exclude: [
           "bg.jpg", // Won't compress this file
           // Note: Just use filenames, no paths needed
         ],
       }),
     ]
   }
   ```

2. `excludePublic`: Skip images in your public folder using patterns:

   ```js
   // vite.config.js
   {
     plugins: [
       vsharp({
         excludePublic: [
           "public/*", // Skip everything in public
           "public/test_img/*", // Skip all images in test_img
         ],
       }),
     ]
   }
   ```

3. `includePublic`: Choose specific files to compress from excluded folders:

   ```js
   // vite.config.js
   {
     plugins: [
       vsharp({
         excludePublic: [
           "public/*" // Skip all public files
         ],
         includePublic: [
           "public/images/*", // But compress files in this folder
           "public/test_img/001.jpg", // And this specific image
         ],
       }),
     ]
   }
   ```

   Note: `includePublic` takes priority over `excludePublic`, letting you:
   - First exclude entire folders
   - Then pick specific files or folders to include
   - Use either patterns or exact file paths

4. Image Size Options: Control how your images are resized:

   ```js
   // vite.config.js
   {
     plugins: [
       vsharp({
         width: 800, // Maximum width (won't upscale smaller images)
         height: 800, // Maximum height (won't upscale smaller images)
         scale: 0.8, // Or use this to reduce by percentage (overrides width/height)
       }),
     ]
   }
   ```

5. Metadata Options: Keep important image information:

   ```js
   // vite.config.js
   {
     plugins: [
       vsharp({
         preserveMetadata: {
           orientation: true, // Keeps correct image orientation
         },
       }),
     ]
   }
   ```

## Default Settings

VSharp comes with these sensible defaults, which you can override as needed:

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
  ".gif": {
    
  },
  "preserveMetadata": {
    "orientation": false
  }
}
```

For more advanced options, check out the [Sharp documentation](https://sharp.pixelplumbing.com/api-constructor).
