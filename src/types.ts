// Types for Birthday Card Frame Application

// Frame asset with associated mask
export interface FrameAsset {
  id: string;
  name: string;
  imageData: string; // base64
  width: number;
  height: number;
  mask: MaskGeometry | null;
}

// Mask geometry for photo window
export interface MaskGeometry {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

// Photo asset
export interface PhotoAsset {
  id: string;
  name: string;
  imageData: string; // base64
  width: number;
  height: number;
}

// Photo transform within card
export interface PhotoTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

// Text layer properties
export interface TextProperties {
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  x: number;
  y: number;
  outlineColor: string;
  outlineWidth: number;
  shadowEnabled: boolean;
  visible: boolean;
}

// Complete card project state
export interface CardProject {
  selectedFrameId: string | null;
  selectedPhotoId: string | null;
  photoTransform: PhotoTransform;
  textProperties: TextProperties;
}

// Export settings
export interface ExportSettings {
  resolution: 1 | 2 | 4;
  transparentBackground: boolean;
  format: 'png' | 'pdf';
  pdfSize: 'a4' | 'letter';
}

// Default values
export const DEFAULT_PHOTO_TRANSFORM: PhotoTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
};

export const DEFAULT_TEXT_PROPERTIES: TextProperties = {
  content: 'Happy Birthday!',
  fontFamily: 'Dancing Script',
  fontSize: 48,
  color: '#FFD700',
  x: 540,
  y: 200,
  outlineColor: '#8B4513',
  outlineWidth: 2,
  shadowEnabled: true,
  visible: false,
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  resolution: 1,
  transparentBackground: false,
  format: 'png',
  pdfSize: 'a4',
};

// Canvas dimensions (export size)
export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;
