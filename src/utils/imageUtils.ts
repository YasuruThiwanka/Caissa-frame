// Image processing utilities for Birthday Card Frame App

import type { MaskGeometry, PhotoTransform } from '../types';

// Generate unique ID
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Load image from file and return base64 data URL
export const loadImageAsBase64 = (file: File): Promise<{ data: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    data: e.target?.result as string,
                    width: img.width,
                    height: img.height,
                });
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Detect transparent region in PNG image (finds bounding box of transparent area)
export const detectTransparentRegion = (imageData: string): Promise<MaskGeometry | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                resolve(null);
                return;
            }

            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = data.data;

            // Find bounding box of transparent region
            let minX = canvas.width;
            let minY = canvas.height;
            let maxX = 0;
            let maxY = 0;
            let foundTransparent = false;

            // Scan for transparent pixels (alpha < 10)
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const idx = (y * canvas.width + x) * 4;
                    const alpha = pixels[idx + 3];

                    // Check if pixel is transparent or nearly white (the window area)
                    if (alpha < 10 || (pixels[idx] > 240 && pixels[idx + 1] > 240 && pixels[idx + 2] > 240 && alpha > 200)) {
                        foundTransparent = true;
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }

            if (!foundTransparent || maxX - minX < 50 || maxY - minY < 50) {
                // No significant transparent area found, use center area as default
                const centerX = canvas.width * 0.15;
                const centerY = canvas.height * 0.15;
                const width = canvas.width * 0.7;
                const height = canvas.height * 0.5;

                resolve({
                    type: 'rectangle',
                    x: centerX,
                    y: centerY,
                    width: width,
                    height: height,
                });
                return;
            }

            // Add small padding
            const padding = 5;
            resolve({
                type: 'rectangle',
                x: Math.max(0, minX - padding),
                y: Math.max(0, minY - padding),
                width: Math.min(canvas.width - minX + padding * 2, maxX - minX + padding * 2),
                height: Math.min(canvas.height - minY + padding * 2, maxY - minY + padding * 2),
            });
        };
        img.onerror = () => resolve(null);
        img.src = imageData;
    });
};

// Calculate photo transform to fit within mask, prioritizing upper half for faces
export const calculateFitTransform = (
    photoWidth: number,
    photoHeight: number,
    mask: MaskGeometry,
    mode: 'fit' | 'fill' | 'center' = 'fill'
): PhotoTransform => {
    const maskAspect = mask.width / mask.height;
    const photoAspect = photoWidth / photoHeight;

    let scale: number;

    if (mode === 'fit') {
        // Photo fits entirely within mask
        scale = photoAspect > maskAspect
            ? mask.width / photoWidth
            : mask.height / photoHeight;
    } else {
        // Photo fills mask (cover behavior)
        scale = photoAspect > maskAspect
            ? mask.height / photoHeight
            : mask.width / photoWidth;
    }

    // Calculate position to center horizontally but show upper portion for faces
    const scaledWidth = photoWidth * scale;
    const scaledHeight = photoHeight * scale;

    // Center horizontally
    const x = mask.x + (mask.width - scaledWidth) / 2;

    // Position to show upper third of photo (face priority)
    // This ensures faces are typically visible in the frame
    let y: number;
    if (mode === 'center') {
        y = mask.y + (mask.height - scaledHeight) / 2;
    } else {
        // Show upper portion - offset by 20% of the overflow
        const overflow = scaledHeight - mask.height;
        y = mask.y - overflow * 0.2;
    }

    return {
        x,
        y,
        scale,
        rotation: 0,
    };
};

// Create a downscaled preview image
export const createPreviewImage = async (
    imageData: string,
    maxWidth: number = 300,
    maxHeight: number = 300
): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
            const width = img.width * scale;
            const height = img.height * scale;

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            } else {
                resolve(imageData);
            }
        };
        img.onerror = () => resolve(imageData);
        img.src = imageData;
    });
};
