import { useState, useEffect, useRef, useCallback } from 'react';
import Konva from 'konva';
import FrameUploadGallery from './components/FrameUploadGallery';
import PhotoUploadGallery from './components/PhotoUploadGallery';
import MaskEditor from './components/MaskEditor';
import CardComposerCanvas from './components/CardComposerCanvas';
import PhotoControls from './components/PhotoControls';
import TextControls from './components/TextControls';
import ExportModal from './components/ExportModal';
import type {
  FrameAsset,
  PhotoAsset,
  CardProject,
  MaskGeometry,
} from './types';
import {
  DEFAULT_PHOTO_TRANSFORM,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './types';
import {
  loadFrames,
  saveFrames,
  loadPhotos,
  savePhotos,
  loadProject,
  saveProject
} from './utils/storage';
import { calculateFitTransform } from './utils/imageUtils';
import './App.css';

function App() {
  // State
  const [frames, setFrames] = useState<FrameAsset[]>([]);
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [project, setProject] = useState<CardProject>(() => loadProject());
  const [editingMaskFrameId, setEditingMaskFrameId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const stageRef = useRef<Konva.Stage | null>(null);

  // Load default Caissa frame
  const loadDefaultFrame = useCallback(async () => {
    try {
      const response = await fetch('/default-frame.png');
      const blob = await response.blob();

      return new Promise<FrameAsset | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Default mask for the Caissa frame (the white area)
            const defaultMask: MaskGeometry = {
              type: 'rectangle',
              x: 86,
              y: 235,
              width: 400,
              height: 385,
            };

            resolve({
              id: 'default-caissa-frame',
              name: 'Caissa Birthday Frame',
              imageData: e.target?.result as string,
              width: img.width,
              height: img.height,
              mask: defaultMask,
            });
          };
          img.onerror = () => resolve(null);
          img.src = e.target?.result as string;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading default frame:', error);
      return null;
    }
  }, []);

  // Load persisted data on mount
  useEffect(() => {
    const initializeApp = async () => {
      const savedFrames = loadFrames();
      const savedPhotos = loadPhotos();

      // Check if default frame already exists
      const hasDefaultFrame = savedFrames.some(f => f.id === 'default-caissa-frame');

      if (!hasDefaultFrame) {
        const defaultFrame = await loadDefaultFrame();
        if (defaultFrame) {
          setFrames([defaultFrame, ...savedFrames]);
        } else {
          setFrames(savedFrames);
        }
      } else {
        setFrames(savedFrames);
      }

      setPhotos(savedPhotos);
    };

    initializeApp();
  }, [loadDefaultFrame]);

  // Save frames when changed
  useEffect(() => {
    saveFrames(frames);
  }, [frames]);

  // Save photos when changed
  useEffect(() => {
    savePhotos(photos);
  }, [photos]);

  // Save project when changed
  useEffect(() => {
    saveProject(project);
  }, [project]);

  // Get selected frame and photo
  const selectedFrame = frames.find(f => f.id === project.selectedFrameId) || null;
  const selectedPhoto = photos.find(p => p.id === project.selectedPhotoId) || null;

  // Handle frame selection
  const handleFrameSelect = useCallback((frameId: string) => {
    setProject(prev => {
      // If selecting a new frame with mask, recalculate photo transform
      const frame = frames.find(f => f.id === frameId);
      const photo = photos.find(p => p.id === prev.selectedPhotoId);

      let newTransform = prev.photoTransform;

      if (frame?.mask && photo) {
        // Scale mask to canvas coordinates
        const frameScale = Math.min(CANVAS_WIDTH / frame.width, CANVAS_HEIGHT / frame.height);
        const frameOffsetX = (CANVAS_WIDTH - frame.width * frameScale) / 2;
        const frameOffsetY = (CANVAS_HEIGHT - frame.height * frameScale) / 2;

        const scaledMask: MaskGeometry = {
          type: 'rectangle',
          x: frameOffsetX + frame.mask.x * frameScale,
          y: frameOffsetY + frame.mask.y * frameScale,
          width: frame.mask.width * frameScale,
          height: frame.mask.height * frameScale,
        };

        newTransform = calculateFitTransform(photo.width, photo.height, scaledMask, 'fill');
      }

      return {
        ...prev,
        selectedFrameId: frameId,
        photoTransform: newTransform,
      };
    });
  }, [frames, photos]);

  // Handle photo selection
  const handlePhotoSelect = useCallback((photoId: string) => {
    setProject(prev => {
      const photo = photos.find(p => p.id === photoId);
      const frame = frames.find(f => f.id === prev.selectedFrameId);

      let newTransform = DEFAULT_PHOTO_TRANSFORM;

      if (frame?.mask && photo) {
        // Scale mask to canvas coordinates
        const frameScale = Math.min(CANVAS_WIDTH / frame.width, CANVAS_HEIGHT / frame.height);
        const frameOffsetX = (CANVAS_WIDTH - frame.width * frameScale) / 2;
        const frameOffsetY = (CANVAS_HEIGHT - frame.height * frameScale) / 2;

        const scaledMask: MaskGeometry = {
          type: 'rectangle',
          x: frameOffsetX + frame.mask.x * frameScale,
          y: frameOffsetY + frame.mask.y * frameScale,
          width: frame.mask.width * frameScale,
          height: frame.mask.height * frameScale,
        };

        newTransform = calculateFitTransform(photo.width, photo.height, scaledMask, 'fill');
      }

      return {
        ...prev,
        selectedPhotoId: photoId,
        photoTransform: newTransform,
      };
    });
  }, [frames, photos]);

  // Handle mask save
  const handleMaskSave = (mask: MaskGeometry) => {
    if (!editingMaskFrameId) return;

    setFrames(prev => prev.map(frame =>
      frame.id === editingMaskFrameId
        ? { ...frame, mask }
        : frame
    ));

    // Recalculate photo transform with new mask
    if (editingMaskFrameId === project.selectedFrameId && selectedPhoto) {
      const frame = frames.find(f => f.id === editingMaskFrameId);
      if (frame) {
        const frameScale = Math.min(CANVAS_WIDTH / frame.width, CANVAS_HEIGHT / frame.height);
        const frameOffsetX = (CANVAS_WIDTH - frame.width * frameScale) / 2;
        const frameOffsetY = (CANVAS_HEIGHT - frame.height * frameScale) / 2;

        const scaledMask: MaskGeometry = {
          type: 'rectangle',
          x: frameOffsetX + mask.x * frameScale,
          y: frameOffsetY + mask.y * frameScale,
          width: mask.width * frameScale,
          height: mask.height * frameScale,
        };

        const newTransform = calculateFitTransform(
          selectedPhoto.width,
          selectedPhoto.height,
          scaledMask,
          'fill'
        );

        setProject(prev => ({
          ...prev,
          photoTransform: newTransform,
        }));
      }
    }
  };

  // Get current mask in canvas coordinates
  const getCurrentMask = useCallback((): MaskGeometry | null => {
    if (!selectedFrame?.mask) return null;

    const frameScale = Math.min(CANVAS_WIDTH / selectedFrame.width, CANVAS_HEIGHT / selectedFrame.height);
    const frameOffsetX = (CANVAS_WIDTH - selectedFrame.width * frameScale) / 2;
    const frameOffsetY = (CANVAS_HEIGHT - selectedFrame.height * frameScale) / 2;

    return {
      type: 'rectangle',
      x: frameOffsetX + selectedFrame.mask.x * frameScale,
      y: frameOffsetY + selectedFrame.mask.y * frameScale,
      width: selectedFrame.mask.width * frameScale,
      height: selectedFrame.mask.height * frameScale,
    };
  }, [selectedFrame]);

  // Save current card as image to saved cards gallery
  const handleSaveCard = useCallback(async () => {
    if (!stageRef.current || !selectedFrame) return;

    const stage = stageRef.current;
    const currentWidth = stage.width();
    const currentHeight = stage.height();
    const pixelRatio = Math.max(CANVAS_WIDTH / currentWidth, CANVAS_HEIGHT / currentHeight);

    try {
      const dataUrl = stage.toDataURL({
        pixelRatio: pixelRatio,
        mimeType: 'image/png',
        quality: 1,
      });

      // Save to localStorage as saved cards
      const savedCards = JSON.parse(localStorage.getItem('caissa-saved-cards') || '[]');
      const newCard = {
        id: `card-${Date.now()}`,
        timestamp: new Date().toISOString(),
        imageData: dataUrl,
        frameId: project.selectedFrameId,
        photoId: project.selectedPhotoId,
      };
      savedCards.unshift(newCard);
      // Keep only last 20 cards
      if (savedCards.length > 20) savedCards.pop();
      localStorage.setItem('caissa-saved-cards', JSON.stringify(savedCards));

      alert('✅ Card saved successfully!');
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Error saving card. Please try again.');
    }
  }, [stageRef, selectedFrame, project]);

  const editingFrame = frames.find(f => f.id === editingMaskFrameId);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="logo">
          <img src="/caissa-logo.png" alt="Caissa" className="logo-img" />
          <h1>Caissa Birthday Card Generator</h1>
        </div>
        <div className="header-actions">
          <button
            className="save-header-btn"
            onClick={handleSaveCard}
            disabled={!selectedFrame || !selectedPhoto}
            title="Save card to gallery"
          >
            💾 Save Card
          </button>
          <button
            className="export-header-btn"
            onClick={() => setShowExportModal(true)}
            disabled={!selectedFrame}
          >
            📤 Export Card
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="app-layout">
        {/* Left Sidebar */}
        <aside className="sidebar left-sidebar">
          <FrameUploadGallery
            frames={frames}
            selectedFrameId={project.selectedFrameId}
            onFramesChange={setFrames}
            onFrameSelect={handleFrameSelect}
            onEditMask={setEditingMaskFrameId}
          />
          <PhotoUploadGallery
            photos={photos}
            selectedPhotoId={project.selectedPhotoId}
            onPhotosChange={setPhotos}
            onPhotoSelect={handlePhotoSelect}
          />
        </aside>

        {/* Main Canvas Area */}
        <main className="main-canvas">
          <CardComposerCanvas
            frame={selectedFrame}
            photo={selectedPhoto}
            photoTransform={project.photoTransform}
            textProperties={project.textProperties}
            onPhotoTransformChange={(transform) =>
              setProject(prev => ({ ...prev, photoTransform: transform }))
            }
            onTextPropertiesChange={(textProperties) =>
              setProject(prev => ({ ...prev, textProperties }))
            }
            stageRef={stageRef}
          />
        </main>

        {/* Right Sidebar */}
        <aside className="sidebar right-sidebar">
          <PhotoControls
            photoTransform={project.photoTransform}
            photo={selectedPhoto}
            mask={getCurrentMask()}
            onTransformChange={(transform) =>
              setProject(prev => ({ ...prev, photoTransform: transform }))
            }
          />
          <TextControls
            textProperties={project.textProperties}
            onTextPropertiesChange={(textProperties) =>
              setProject(prev => ({ ...prev, textProperties }))
            }
          />
        </aside>
      </div>

      {/* Mask Editor Modal */}
      {editingFrame && (
        <MaskEditor
          frame={editingFrame}
          onSave={handleMaskSave}
          onClose={() => setEditingMaskFrameId(null)}
        />
      )}

      {/* Export Modal */}
      {showExportModal && stageRef.current && (
        <ExportModal
          stageRef={stageRef as React.RefObject<Konva.Stage>}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

export default App;
