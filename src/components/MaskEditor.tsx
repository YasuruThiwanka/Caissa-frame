import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import type { FrameAsset, MaskGeometry } from '../types';
import './MaskEditor.css';

interface MaskEditorProps {
    frame: FrameAsset;
    onSave: (mask: MaskGeometry) => void;
    onClose: () => void;
}

const MaskEditor: React.FC<MaskEditorProps> = ({ frame, onSave, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 600, height: 800 });
    const [mask, setMask] = useState<MaskGeometry>(
        frame.mask || {
            type: 'rectangle',
            x: frame.width * 0.15,
            y: frame.height * 0.15,
            width: frame.width * 0.7,
            height: frame.height * 0.5,
        }
    );
    const [selected, setSelected] = useState(true);
    const rectRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);

    // Load frame image
    useEffect(() => {
        const img = new window.Image();
        img.src = frame.imageData;
        img.onload = () => setImage(img);
    }, [frame.imageData]);

    // Calculate container size
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerSize({
                    width: rect.width,
                    height: rect.height,
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Attach transformer
    useEffect(() => {
        if (selected && rectRef.current && transformerRef.current) {
            transformerRef.current.nodes([rectRef.current]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [selected]);

    // Calculate scale to fit frame in container
    const scale = Math.min(
        (containerSize.width - 40) / frame.width,
        (containerSize.height - 40) / frame.height,
        1
    );

    const stageWidth = frame.width * scale;
    const stageHeight = frame.height * scale;

    const handleTransformEnd = () => {
        const node = rectRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale and apply to width/height
        node.scaleX(1);
        node.scaleY(1);

        setMask({
            type: 'rectangle',
            x: node.x() / scale,
            y: node.y() / scale,
            width: (node.width() * scaleX) / scale,
            height: (node.height() * scaleY) / scale,
        });
    };

    const handleDragEnd = () => {
        const node = rectRef.current;
        if (!node) return;

        setMask({
            ...mask,
            x: node.x() / scale,
            y: node.y() / scale,
        });
    };

    const handleSave = () => {
        onSave(mask);
        onClose();
    };

    return (
        <div className="mask-editor-overlay">
            <div className="mask-editor-modal">
                <div className="mask-editor-header">
                    <h2>✂️ Define Photo Window</h2>
                    <p>Drag and resize the rectangle to define where photos will appear</p>
                </div>

                <div className="mask-editor-canvas" ref={containerRef}>
                    <Stage
                        width={stageWidth}
                        height={stageHeight}
                        style={{ margin: 'auto' }}
                    >
                        <Layer>
                            {/* Frame image */}
                            {image && (
                                <KonvaImage
                                    image={image}
                                    width={stageWidth}
                                    height={stageHeight}
                                    opacity={0.8}
                                />
                            )}

                            {/* Mask rectangle */}
                            <Rect
                                ref={rectRef}
                                x={mask.x * scale}
                                y={mask.y * scale}
                                width={mask.width * scale}
                                height={mask.height * scale}
                                fill="rgba(99, 102, 241, 0.3)"
                                stroke="#6366f1"
                                strokeWidth={2}
                                draggable
                                onDragEnd={handleDragEnd}
                                onTransformEnd={handleTransformEnd}
                                onClick={() => setSelected(true)}
                                onTap={() => setSelected(true)}
                            />

                            {/* Transformer */}
                            {selected && (
                                <Transformer
                                    ref={transformerRef}
                                    rotateEnabled={false}
                                    keepRatio={false}
                                    boundBoxFunc={(oldBox, newBox) => {
                                        // Limit minimum size
                                        if (newBox.width < 50 || newBox.height < 50) {
                                            return oldBox;
                                        }
                                        return newBox;
                                    }}
                                />
                            )}
                        </Layer>
                    </Stage>
                </div>

                <div className="mask-info">
                    <span>Position: ({Math.round(mask.x)}, {Math.round(mask.y)})</span>
                    <span>Size: {Math.round(mask.width)} × {Math.round(mask.height)}</span>
                </div>

                <div className="mask-editor-actions">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn-save" onClick={handleSave}>
                        💾 Save Mask
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaskEditor;
