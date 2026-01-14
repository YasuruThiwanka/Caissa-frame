import { useCallback } from 'react';
import type { PhotoTransform, MaskGeometry, PhotoAsset } from '../types';
import { DEFAULT_PHOTO_TRANSFORM } from '../types';
import { calculateFitTransform } from '../utils/imageUtils';
import './PhotoControls.css';

interface PhotoControlsProps {
    photoTransform: PhotoTransform;
    photo: PhotoAsset | null;
    mask: MaskGeometry | null;
    onTransformChange: (transform: PhotoTransform) => void;
}

const PhotoControls: React.FC<PhotoControlsProps> = ({
    photoTransform,
    photo,
    mask,
    onTransformChange,
}) => {
    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onTransformChange({
            ...photoTransform,
            scale: parseFloat(e.target.value),
        });
    };

    const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onTransformChange({
            ...photoTransform,
            rotation: parseInt(e.target.value),
        });
    };

    const handleCenter = useCallback(() => {
        if (photo && mask) {
            const newTransform = calculateFitTransform(photo.width, photo.height, mask, 'center');
            onTransformChange(newTransform);
        }
    }, [photo, mask, onTransformChange]);

    const handleFit = useCallback(() => {
        if (photo && mask) {
            const newTransform = calculateFitTransform(photo.width, photo.height, mask, 'fit');
            onTransformChange(newTransform);
        }
    }, [photo, mask, onTransformChange]);

    const handleFill = useCallback(() => {
        if (photo && mask) {
            const newTransform = calculateFitTransform(photo.width, photo.height, mask, 'fill');
            onTransformChange(newTransform);
        }
    }, [photo, mask, onTransformChange]);

    const handleReset = () => {
        if (photo && mask) {
            const newTransform = calculateFitTransform(photo.width, photo.height, mask, 'fill');
            onTransformChange({
                ...newTransform,
                rotation: 0,
            });
        } else {
            onTransformChange(DEFAULT_PHOTO_TRANSFORM);
        }
    };

    const isDisabled = !photo;

    return (
        <div className="photo-controls">
            <h3>📐 Photo Fitting</h3>

            <div className="control-group">
                <label>
                    <span className="label-text">Zoom</span>
                    <span className="label-value">{(photoTransform.scale * 100).toFixed(0)}%</span>
                </label>
                <input
                    type="range"
                    min="0.3"
                    max="3"
                    step="0.05"
                    value={photoTransform.scale}
                    onChange={handleZoomChange}
                    disabled={isDisabled}
                    className="slider"
                />
            </div>

            <div className="control-group">
                <label>
                    <span className="label-text">Rotation</span>
                    <span className="label-value">{photoTransform.rotation}°</span>
                </label>
                <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={photoTransform.rotation}
                    onChange={handleRotationChange}
                    disabled={isDisabled}
                    className="slider"
                />
            </div>

            <div className="control-buttons">
                <button onClick={handleCenter} disabled={isDisabled} title="Center photo">
                    ⊙ Center
                </button>
                <button onClick={handleFit} disabled={isDisabled} title="Fit entire photo">
                    ⊡ Fit
                </button>
                <button onClick={handleFill} disabled={isDisabled} title="Fill frame area">
                    ⊞ Fill
                </button>
                <button onClick={handleReset} disabled={isDisabled} title="Reset position">
                    ↺ Reset
                </button>
            </div>

            {isDisabled && (
                <p className="disabled-hint">Select a photo to enable controls</p>
            )}
        </div>
    );
};

export default PhotoControls;
