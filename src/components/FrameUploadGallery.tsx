import { useRef } from 'react';
import type { FrameAsset } from '../types';
import { loadImageAsBase64, generateId, detectTransparentRegion } from '../utils/imageUtils';
import './FrameUploadGallery.css';

interface FrameUploadGalleryProps {
    frames: FrameAsset[];
    selectedFrameId: string | null;
    onFramesChange: (frames: FrameAsset[]) => void;
    onFrameSelect: (frameId: string) => void;
    onEditMask: (frameId: string) => void;
}

const FrameUploadGallery: React.FC<FrameUploadGalleryProps> = ({
    frames,
    selectedFrameId,
    onFramesChange,
    onFrameSelect,
    onEditMask,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFrames: FrameAsset[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;

            try {
                const { data, width, height } = await loadImageAsBase64(file);

                // Auto-detect transparent region for mask
                const detectedMask = await detectTransparentRegion(data);

                newFrames.push({
                    id: generateId(),
                    name: file.name,
                    imageData: data,
                    width,
                    height,
                    mask: detectedMask,
                });
            } catch (error) {
                console.error('Error loading frame:', error);
            }
        }

        onFramesChange([...frames, ...newFrames]);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = (frameId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onFramesChange(frames.filter(f => f.id !== frameId));
    };

    return (
        <div className="frame-upload-gallery">
            <div className="gallery-header">
                <h3>📷 Card Frames</h3>
                <button
                    className="upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <span className="icon">+</span> Add Frame
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                />
            </div>

            <div className="gallery-grid">
                {frames.length === 0 ? (
                    <div className="empty-state">
                        <p>No frames uploaded yet</p>
                        <p className="hint">Upload PNG frames with transparent areas</p>
                    </div>
                ) : (
                    frames.map((frame) => (
                        <div
                            key={frame.id}
                            className={`frame-item ${selectedFrameId === frame.id ? 'selected' : ''}`}
                            onClick={() => onFrameSelect(frame.id)}
                        >
                            <div className="frame-preview">
                                <img src={frame.imageData} alt={frame.name} />
                                {frame.mask && <div className="mask-indicator">✓ Mask</div>}
                            </div>
                            <div className="frame-actions">
                                <button
                                    className="action-btn edit"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditMask(frame.id);
                                    }}
                                    title="Edit Mask"
                                >
                                    ✏️
                                </button>
                                <button
                                    className="action-btn delete"
                                    onClick={(e) => handleDelete(frame.id, e)}
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>
                            <div className="frame-name">{frame.name}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FrameUploadGallery;
