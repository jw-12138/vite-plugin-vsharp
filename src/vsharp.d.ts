import {JpegOptions, PngOptions, WebpOptions, GifOptions} from "sharp";
import {Plugin} from "vite";

interface PreserveMetadata {
  orientation?: boolean;
}

interface VSharpOptions {
  scale?: number;
  width?: number;
  height?: number;
  includePublic?: string[];
  excludePublic?: string[];
  exclude?: string[];
  '.jpg'?: JpegOptions;
  '.jpeg'?: JpegOptions;
  '.png'?: PngOptions;
  '.webp'?: WebpOptions;
  '.gif'?: GifOptions;
  preserveMetadata?: PreserveMetadata;
}

declare function vsharp(options?: VSharpOptions): Plugin;

export {
  type PreserveMetadata,
  type VSharpOptions,
  vsharp as default
}
