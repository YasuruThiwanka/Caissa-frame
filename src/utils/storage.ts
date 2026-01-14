// LocalStorage persistence utilities for Birthday Card Frame App

import type { FrameAsset, PhotoAsset, CardProject } from '../types';
import { DEFAULT_PHOTO_TRANSFORM, DEFAULT_TEXT_PROPERTIES } from '../types';

const STORAGE_KEYS = {
    FRAMES: 'birthday-card-frames',
    PHOTOS: 'birthday-card-photos',
    PROJECT: 'birthday-card-project',
};

// Frame storage
export const saveFrames = (frames: FrameAsset[]): void => {
    try {
        localStorage.setItem(STORAGE_KEYS.FRAMES, JSON.stringify(frames));
    } catch (error) {
        console.error('Error saving frames to localStorage:', error);
    }
};

export const loadFrames = (): FrameAsset[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.FRAMES);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading frames from localStorage:', error);
        return [];
    }
};

// Photo storage
export const savePhotos = (photos: PhotoAsset[]): void => {
    try {
        localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
    } catch (error) {
        console.error('Error saving photos to localStorage:', error);
    }
};

export const loadPhotos = (): PhotoAsset[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PHOTOS);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading photos from localStorage:', error);
        return [];
    }
};

// Project state storage
export const saveProject = (project: CardProject): void => {
    try {
        localStorage.setItem(STORAGE_KEYS.PROJECT, JSON.stringify(project));
    } catch (error) {
        console.error('Error saving project to localStorage:', error);
    }
};

export const loadProject = (): CardProject => {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.PROJECT);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading project from localStorage:', error);
    }

    return {
        selectedFrameId: null,
        selectedPhotoId: null,
        photoTransform: DEFAULT_PHOTO_TRANSFORM,
        textProperties: DEFAULT_TEXT_PROPERTIES,
    };
};

// Clear all storage
export const clearStorage = (): void => {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
};
