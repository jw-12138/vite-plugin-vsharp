# vsharp - A Vite plugin that compresses static images after each builds by using [sharp.js](https://www.npmjs.com/package/sharp)

[vsharp](./) is a plugin for [Vite](https://github.com/vitejs/vite), it compresses all the images in the distribution folder automatically after each builds.

Currently supported file types are:

- `.jpg/.jpeg`
- `.png`
- `.gif`
- `.webp`

Currently supported sharp functions are:

- `sharp().jpeg()`
- `sharp().png()`
- `sharp().gif()`
- `sharp().webp()`

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
    vsharp($OPTIONS)
  ]
})
```

### Exclude specific files

```javascript
// vite.config.js

import vsharp from "vite-plugin-vsharp"

export default ({
  plugins: [
    vsharp({
      exclude: 'bg.jpg' // just use the original asset filename
    })
  ]
})
```

## Defaults

```json
{
  "exclude": [],
  ".jpg": {
    "quality": 80
  },
  ".jpeg": {
    "quality": 80
  },
  ".png": {
    "compressionLevel": 9,
    "quality": 80,
    "palette": true
  },
  ".webp": {
    "lossless": true
  }
}
```

Every other parameter in currently supported sharp functions by this plugin can be found on [the official sharp docs](https://sharp.pixelplumbing.com/api-constructor).
