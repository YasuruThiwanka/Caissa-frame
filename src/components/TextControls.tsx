import type { TextProperties } from '../types';
import './TextControls.css';

interface TextControlsProps {
    textProperties: TextProperties;
    onTextPropertiesChange: (properties: TextProperties) => void;
}

const FONTS = [
    { name: 'Dancing Script', label: 'Dancing Script' },
    { name: 'Playfair Display', label: 'Playfair Display' },
    { name: 'Inter', label: 'Inter' },
    { name: 'Roboto', label: 'Roboto' },
    { name: 'Georgia', label: 'Georgia' },
    { name: 'Arial', label: 'Arial' },
];

const TextControls: React.FC<TextControlsProps> = ({
    textProperties,
    onTextPropertiesChange,
}) => {
    const handleChange = (field: keyof TextProperties, value: string | number | boolean) => {
        onTextPropertiesChange({
            ...textProperties,
            [field]: value,
        });
    };

    return (
        <div className="text-controls">
            <div className="text-header">
                <h3>✨ Birthday Text</h3>
                <label className="toggle-container">
                    <input
                        type="checkbox"
                        checked={textProperties.visible}
                        onChange={(e) => handleChange('visible', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {textProperties.visible && (
                <>
                    <div className="control-group">
                        <label className="label-text">Message</label>
                        <textarea
                            value={textProperties.content}
                            onChange={(e) => handleChange('content', e.target.value)}
                            placeholder="Enter birthday message..."
                            rows={2}
                        />
                    </div>

                    <div className="control-group">
                        <label className="label-text">Font</label>
                        <select
                            value={textProperties.fontFamily}
                            onChange={(e) => handleChange('fontFamily', e.target.value)}
                            style={{ fontFamily: textProperties.fontFamily }}
                        >
                            {FONTS.map((font) => (
                                <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                                    {font.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="control-group">
                        <label>
                            <span className="label-text">Size</span>
                            <span className="label-value">{textProperties.fontSize}px</span>
                        </label>
                        <input
                            type="range"
                            min="16"
                            max="96"
                            step="2"
                            value={textProperties.fontSize}
                            onChange={(e) => handleChange('fontSize', parseInt(e.target.value))}
                            className="slider"
                        />
                    </div>

                    <div className="color-controls">
                        <div className="color-group">
                            <label className="label-text">Text Color</label>
                            <input
                                type="color"
                                value={textProperties.color}
                                onChange={(e) => handleChange('color', e.target.value)}
                            />
                        </div>

                        <div className="color-group">
                            <label className="label-text">Outline</label>
                            <input
                                type="color"
                                value={textProperties.outlineColor}
                                onChange={(e) => handleChange('outlineColor', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="control-group">
                        <label>
                            <span className="label-text">Outline Width</span>
                            <span className="label-value">{textProperties.outlineWidth}px</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={textProperties.outlineWidth}
                            onChange={(e) => handleChange('outlineWidth', parseFloat(e.target.value))}
                            className="slider"
                        />
                    </div>

                    <div className="toggle-row">
                        <span className="label-text">Drop Shadow</span>
                        <label className="toggle-container">
                            <input
                                type="checkbox"
                                checked={textProperties.shadowEnabled}
                                onChange={(e) => handleChange('shadowEnabled', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    <p className="drag-hint">💡 Drag the text on canvas to position it</p>
                </>
            )}
        </div>
    );
};

export default TextControls;
