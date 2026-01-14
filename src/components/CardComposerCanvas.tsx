import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Group, Text, Rect } from 'react-konva';
import Konva from 'konva';
import type { FrameAsset, PhotoAsset, PhotoTransform, TextProperties } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import './CardComposerCanvas.css';

interface CardComposerCanvasProps {
    frame: FrameAsset | null;
    photo: PhotoAsset | null;
    photoTransform: PhotoTransform;
    textProperties: TextProperties;
    onPhotoTransformChange: (transform: PhotoTransform) => void;
    onTextPropertiesChange: (properties: TextProperties) => void;
    stageRef: React.RefObject<Konva.Stage | null>;
}

const CardComposerCanvas: React.FC<CardComposerCanvasProps> = ({
    frame,
    photo,
    photoTransform,
    textProperties,
    onPhotoTransformChange,
    onTextPropertiesChange,
    stageRef,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 400, height: 700 });
    const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);
    const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Calculate display scale
    const displayScale = Math.min(
        containerSize.width / CANVAS_WIDTH,
        containerSize.height / CANVAS_HEIGHT,
        1
    );

    const stageWidth = CANVAS_WIDTH * displayScale;
    const stageHeight = CANVAS_HEIGHT * displayScale;

    // Update container size on resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerSize({
                    width: rect.width - 40,
                    height: rect.height - 40,
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Load frame image
    useEffect(() => {
        if (frame) {
            const img = new window.Image();
            img.src = frame.imageData;
            img.onload = () => setFrameImage(img);
        } else {
            setFrameImage(null);
        }
    }, [frame?.imageData, frame]);

    // Load photo image
    useEffect(() => {
        if (photo) {
            const img = new window.Image();
            img.src = photo.imageData;
            img.onload = () => setPhotoImage(img);
        } else {
            setPhotoImage(null);
        }
    }, [photo?.imageData, photo]);

    // Calculate frame scale to fit canvas
    const frameScale = frame ? Math.min(
        CANVAS_WIDTH / frame.width,
        CANVAS_HEIGHT / frame.height
    ) : 1;

    const frameWidth = frame ? frame.width * frameScale : CANVAS_WIDTH;
    const frameHeight = frame ? frame.height * frameScale : CANVAS_HEIGHT;
    const frameOffsetX = (CANVAS_WIDTH - frameWidth) / 2;
    const frameOffsetY = (CANVAS_HEIGHT - frameHeight) / 2;

    // Get mask in canvas coordinates
    const getMaskInCanvas = useCallback(() => {
        if (!frame?.mask) {
            return {
                x: CANVAS_WIDTH * 0.15,
                y: CANVAS_HEIGHT * 0.15,
                width: CANVAS_WIDTH * 0.7,
                height: CANVAS_HEIGHT * 0.5,
            };
        }
        return {
            x: frameOffsetX + frame.mask.x * frameScale,
            y: frameOffsetY + frame.mask.y * frameScale,
            width: frame.mask.width * frameScale,
            height: frame.mask.height * frameScale,
        };
    }, [frame, frameScale, frameOffsetX, frameOffsetY]);

    const mask = getMaskInCanvas();

    // Handle photo drag
    const handlePhotoDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        onPhotoTransformChange({
            ...photoTransform,
            x: node.x() / displayScale,
            y: node.y() / displayScale,
        });
    };

    // Handle text drag
    const handleTextDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        onTextPropertiesChange({
            ...textProperties,
            x: node.x() / displayScale,
            y: node.y() / displayScale,
        });
    };

    // Calculate photo dimensions to fill mask with upper portion visible
    const getPhotoDisplayProps = useCallback(() => {
        if (!photo || !photoTransform) return null;

        const photoAspect = photo.width / photo.height;
        const maskAspect = mask.width / mask.height;

        // Cover behavior: photo fills the mask
        let photoDisplayWidth: number;
        let photoDisplayHeight: number;

        if (photoAspect > maskAspect) {
            // Photo is wider - scale by height
            photoDisplayHeight = mask.height / photoTransform.scale;
            photoDisplayWidth = photoDisplayHeight * photoAspect;
        } else {
            // Photo is taller - scale by width
            photoDisplayWidth = mask.width / photoTransform.scale;
            photoDisplayHeight = photoDisplayWidth / photoAspect;
        }

        // Apply scale
        photoDisplayWidth *= photoTransform.scale;
        photoDisplayHeight *= photoTransform.scale;

        return {
            width: photoDisplayWidth,
            height: photoDisplayHeight,
        };
    }, [photo, photoTransform, mask]);

    const photoDisplayProps = getPhotoDisplayProps();

    return (
        <div className="card-composer-canvas" ref={containerRef}>
            {!frame ? (
                <div className="canvas-placeholder">
                    <div className="placeholder-icon">🖼️</div>
                    <p>Select a frame to start</p>
                    <p className="hint">Upload and select a frame from the left panel</p>
                </div>
            ) : (
                <Stage
                    ref={stageRef as React.RefObject<Konva.Stage>}
                    width={stageWidth}
                    height={stageHeight}
                    style={{
                        background: 'repeating-conic-gradient(#2a2a3e 0% 25%, #1e1e2e 0% 50%) 50% / 20px 20px',
                        borderRadius: '12px',
                    }}
                >
                    <Layer>
                        {/* Photo layer (clipped to mask) */}
                        <Group
                            clipFunc={(ctx) => {
                                ctx.beginPath();
                                ctx.rect(
                                    mask.x * displayScale,
                                    mask.y * displayScale,
                                    mask.width * displayScale,
                                    mask.height * displayScale
                                );
                                ctx.closePath();
                            }}
                        >
                            {photoImage && photoDisplayProps && (
                                <KonvaImage
                                    image={photoImage}
                                    x={(photoTransform.x || mask.x) * displayScale}
                                    y={(photoTransform.y || mask.y) * displayScale}
                                    width={photoDisplayProps.width * displayScale}
                                    height={photoDisplayProps.height * displayScale}
                                    rotation={photoTransform.rotation}
                                    draggable
                                    onDragStart={() => setIsDragging(true)}
                                    onDragEnd={(e) => {
                                        setIsDragging(false);
                                        handlePhotoDrag(e);
                                    }}
                                    onDragMove={handlePhotoDrag}
                                />
                            )}

                            {/* Placeholder when no photo */}
                            {!photo && (
                                <Rect
                                    x={mask.x * displayScale}
                                    y={mask.y * displayScale}
                                    width={mask.width * displayScale}
                                    height={mask.height * displayScale}
                                    fill="rgba(99, 102, 241, 0.1)"
                                    stroke="rgba(99, 102, 241, 0.3)"
                                    strokeWidth={2}
                                    dash={[10, 5]}
                                />
                            )}
                        </Group>

                        {/* Frame overlay */}
                        {frameImage && (
                            <KonvaImage
                                image={frameImage}
                                x={frameOffsetX * displayScale}
                                y={frameOffsetY * displayScale}
                                width={frameWidth * displayScale}
                                height={frameHeight * displayScale}
                                listening={false}
                            />
                        )}

                        {/* Birthday text */}
                        {textProperties.visible && (
                            <Text
                                x={textProperties.x * displayScale}
                                y={textProperties.y * displayScale}
                                text={textProperties.content}
                                fontSize={textProperties.fontSize * displayScale}
                                fontFamily={textProperties.fontFamily}
                                fill={textProperties.color}
                                stroke={textProperties.outlineWidth > 0 ? textProperties.outlineColor : undefined}
                                strokeWidth={textProperties.outlineWidth * displayScale}
                                shadowEnabled={textProperties.shadowEnabled}
                                shadowColor="rgba(0,0,0,0.5)"
                                shadowBlur={10 * displayScale}
                                shadowOffset={{ x: 2 * displayScale, y: 2 * displayScale }}
                                draggable
                                onDragEnd={handleTextDrag}
                                align="center"
                            />
                        )}
                    </Layer>
                </Stage>
            )}

            {isDragging && (
                <div className="drag-indicator">
                    🖐️ Drag to position photo
                </div>
            )}
        </div>
    );
};

export default CardComposerCanvas;
