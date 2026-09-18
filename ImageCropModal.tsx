import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Move, Sparkles } from 'lucide-react';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  isSaving?: boolean;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  isSaving = false,
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load natural image dimensions when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  if (!isOpen) return null;

  // Viewport size in pixels for the crop window
  const CROP_BOX_SIZE = 280;

  // Mouse / Touch drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleSaveCrop = () => {
    if (!imageRef.current || !imageSize) return;

    const canvas = document.createElement('canvas');
    const OUTPUT_SIZE = 512;
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable high quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calculate scaling from crop viewport to native image coordinates
    // Base fit: fit image within CROP_BOX_SIZE
    const scaleFactor = Math.max(
      CROP_BOX_SIZE / imageSize.width,
      CROP_BOX_SIZE / imageSize.height
    );

    const renderedWidth = imageSize.width * scaleFactor * zoom;
    const renderedHeight = imageSize.height * scaleFactor * zoom;

    // Center of rendered image relative to center of crop box
    const renderedX = (CROP_BOX_SIZE - renderedWidth) / 2 + position.x;
    const renderedY = (CROP_BOX_SIZE - renderedHeight) / 2 + position.y;

    // Transform to canvas output coordinate space (512x512)
    const ratio = OUTPUT_SIZE / CROP_BOX_SIZE;
    const destWidth = renderedWidth * ratio;
    const destHeight = renderedHeight * ratio;
    const destX = renderedX * ratio;
    const destY = renderedY * ratio;

    ctx.drawImage(imageRef.current, destX, destY, destWidth, destHeight);

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0f1629] border border-[#213052] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#1c2947] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Adjust & Crop Profile Picture</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag to reposition and zoom to frame your profile display picture
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#18233d] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Crop Stage */}
        <div className="p-6 flex flex-col items-center justify-center bg-[#090d17]">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ width: CROP_BOX_SIZE, height: CROP_BOX_SIZE }}
            className="relative overflow-hidden rounded-full cursor-grab active:cursor-grabbing select-none border-2 border-purple-500 shadow-2xl bg-black"
          >
            {/* The Image being positioned and zoomed */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'cover',
                width: '100%',
                height: '100%',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
              className="transition-transform duration-75 ease-out"
            />

            {/* Circular Grid & Guide overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-full h-[1px] bg-white/10" />
              <div className="h-full w-[1px] bg-white/10 absolute" />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-purple-400" />
            <span>Click & drag image to reposition inside circle</span>
          </p>
        </div>

        {/* Controls: Zoom & Reset */}
        <div className="p-5 bg-[#0f1629] border-t border-[#1c2947] space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-purple-400" />
                <span>Zoom Level</span>
              </span>
              <span className="text-purple-300 font-mono text-[11px]">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, Number((z - 0.1).toFixed(2))))}
                className="p-2 rounded-xl bg-[#17223b] hover:bg-[#1f2e50] text-slate-300 border border-[#23355b] transition-colors cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-purple-500 h-1.5 bg-[#1a2542] rounded-lg cursor-pointer"
              />

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
                className="p-2 rounded-xl bg-[#17223b] hover:bg-[#1f2e50] text-slate-300 border border-[#23355b] transition-colors cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-xl bg-[#17223b] hover:bg-[#1f2e50] text-slate-300 border border-[#23355b] transition-colors cursor-pointer ml-1"
                title="Reset position & zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="py-2.5 px-4 rounded-xl bg-[#16213a] hover:bg-[#1f2e52] text-slate-300 border border-[#233359] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              id="apply-crop-save-dp-btn"
              onClick={handleSaveCrop}
              disabled={isSaving}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving DP...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Apply & Save DP</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
