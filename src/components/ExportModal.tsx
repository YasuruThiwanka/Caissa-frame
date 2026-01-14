import { useState, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { jsPDF } from 'jspdf';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import './ExportModal.css';

interface ExportModalProps {
    stageRef: React.RefObject<Konva.Stage>;
    onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ stageRef, onClose }) => {
    const [pdfSize, setPdfSize] = useState<'a4' | 'letter'>('a4');
    const [isExporting, setIsExporting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Generate high-quality export at exactly 1080x1920
    const generateHighQualityExport = useCallback((): string | null => {
        if (!stageRef.current) return null;

        const stage = stageRef.current;
        const currentWidth = stage.width();
        const currentHeight = stage.height();

        // Calculate the pixel ratio needed to get exactly 1080x1920 output
        const pixelRatioX = CANVAS_WIDTH / currentWidth;
        const pixelRatioY = CANVAS_HEIGHT / currentHeight;
        const pixelRatio = Math.max(pixelRatioX, pixelRatioY);

        try {
            const dataUrl = stage.toDataURL({
                pixelRatio: pixelRatio,
                mimeType: 'image/png',
                quality: 1,
                width: currentWidth,
                height: currentHeight,
            });

            return dataUrl;
        } catch (error) {
            console.error('Error generating export:', error);
            return null;
        }
    }, [stageRef]);

    // Generate preview on mount
    useEffect(() => {
        const dataUrl = generateHighQualityExport();
        if (dataUrl) {
            setPreviewUrl(dataUrl);
        }
    }, [generateHighQualityExport]);

    const handleExportPNG = async () => {
        if (!stageRef.current) return;

        setIsExporting(true);

        try {
            const dataUrl = generateHighQualityExport();

            if (!dataUrl) {
                throw new Error('Failed to generate image');
            }

            // Create download link
            const link = document.createElement('a');
            link.download = `birthday-card-${CANVAS_WIDTH}x${CANVAS_HEIGHT}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting PNG:', error);
            alert('Error exporting image. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        if (!stageRef.current) return;

        setIsExporting(true);

        try {
            const dataUrl = generateHighQualityExport();

            if (!dataUrl) {
                throw new Error('Failed to generate image');
            }

            // Create PDF
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: pdfSize,
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Calculate image dimensions to fit page
            const imgAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
            const pageAspect = pageWidth / pageHeight;

            let imgWidth: number;
            let imgHeight: number;

            if (imgAspect > pageAspect) {
                imgWidth = pageWidth - 20;
                imgHeight = imgWidth / imgAspect;
            } else {
                imgHeight = pageHeight - 20;
                imgWidth = imgHeight * imgAspect;
            }

            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save(`birthday-card.pdf`);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error exporting PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="export-modal-overlay" onClick={onClose}>
            <div className="export-modal" onClick={(e) => e.stopPropagation()}>
                <div className="export-header">
                    <h2>📤 Export Card</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="export-content">
                    <div className="preview-section">
                        <h4>Preview</h4>
                        <div className="preview-container">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Card preview" />
                            ) : (
                                <div className="preview-loading">Generating preview...</div>
                            )}
                        </div>
                        <div className="export-info">
                            <span>📐 Export Size: {CANVAS_WIDTH} × {CANVAS_HEIGHT} px</span>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h4>Export Settings</h4>

                        <div className="setting-group">
                            <label>PDF Paper Size</label>
                            <div className="pdf-options">
                                <button
                                    className={`pdf-btn ${pdfSize === 'a4' ? 'active' : ''}`}
                                    onClick={() => setPdfSize('a4')}
                                >
                                    A4
                                </button>
                                <button
                                    className={`pdf-btn ${pdfSize === 'letter' ? 'active' : ''}`}
                                    onClick={() => setPdfSize('letter')}
                                >
                                    Letter
                                </button>
                            </div>
                        </div>

                        <div className="export-actions">
                            <button
                                className="export-btn png"
                                onClick={handleExportPNG}
                                disabled={isExporting}
                            >
                                {isExporting ? '⏳ Exporting...' : '🖼️ Export PNG (1080×1920)'}
                            </button>
                            <button
                                className="export-btn pdf"
                                onClick={handleExportPDF}
                                disabled={isExporting}
                            >
                                {isExporting ? '⏳ Exporting...' : '📄 Export PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
