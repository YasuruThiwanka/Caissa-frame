import { useRef } from 'react';
import type { PhotoAsset } from '../types';
import { loadImageAsBase64, generateId } from '../utils/imageUtils';
import './PhotoUploadGallery.css';

interface PhotoUploadGalleryProps {
    photos: PhotoAsset[];
    selectedPhotoId: string | null;
    onPhotosChange: (photos: PhotoAsset[]) => void;
    onPhotoSelect: (photoId: string) => void;
}

const PhotoUploadGallery: React.FC<PhotoUploadGalleryProps> = ({
    photos,
    selectedPhotoId,
    onPhotosChange,
    onPhotoSelect,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newPhotos: PhotoAsset[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;

            try {
                const { data, width, height } = await loadImageAsBase64(file);

                newPhotos.push({
                    id: generateId(),
                    name: file.name,
                    imageData: data,
                    width,
                    height,
                });
            } catch (error) {
                console.error('Error loading photo:', error);
            }
        }

        onPhotosChange([...photos, ...newPhotos]);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = (photoId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onPhotosChange(photos.filter(p => p.id !== photoId));
    };

    return (
        <div className="photo-upload-gallery">
            <div className="gallery-header">
                <h3>🖼️ Photos</h3>
                <button
                    className="upload-btn photo"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <span className="icon">+</span> Add Photo
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                />
            </div>

            <div className="photo-grid">
                {photos.length === 0 ? (
                    <div className="empty-state">
                        <p>No photos uploaded yet</p>
                        <p className="hint">Upload photos to place in frames</p>
                    </div>
                ) : (
                    photos.map((photo) => (
                        <div
                            key={photo.id}
                            className={`photo-item ${selectedPhotoId === photo.id ? 'selected' : ''}`}
                            onClick={() => onPhotoSelect(photo.id)}
                        >
                            <div className="photo-preview">
                                <img src={photo.imageData} alt={photo.name} />
                            </div>
                            <button
                                className="delete-btn"
                                onClick={(e) => handleDelete(photo.id, e)}
                                title="Delete"
                            >
                                ×
                            </button>
                            <div className="photo-name">{photo.name}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PhotoUploadGallery;
