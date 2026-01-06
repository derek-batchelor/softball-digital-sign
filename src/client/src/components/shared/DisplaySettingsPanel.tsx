import { useState, useEffect } from 'react';
import { DisplaySettings } from '../../hooks/useDisplaySettings';

interface DisplaySettingsPanelProps {
  settings: DisplaySettings;
  resolution: { width: number; height: number; dpr: number };
  onAdjustScaleX: (delta: number) => void;
  onAdjustScaleY: (delta: number) => void;
  onAdjustScaleBoth: (delta: number) => void;
  onAdjustPosition: (deltaX: number, deltaY: number) => void;
  onReset: () => void;
  onClose: () => void;
}

export const DisplaySettingsPanel = ({
  settings,
  resolution,
  onAdjustScaleX,
  onAdjustScaleY,
  onAdjustScaleBoth,
  onAdjustPosition,
  onReset,
  onClose,
}: DisplaySettingsPanelProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow keys for position
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onAdjustPosition(0, -10);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        onAdjustPosition(0, 10);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onAdjustPosition(-10, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onAdjustPosition(10, 0);
      }
      // + and - for scale both
      else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        if (e.shiftKey) {
          onAdjustScaleY(0.05);
        } else if (e.ctrlKey || e.metaKey) {
          onAdjustScaleX(0.05);
        } else {
          onAdjustScaleBoth(0.05);
        }
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        if (e.shiftKey) {
          onAdjustScaleY(-0.05);
        } else if (e.ctrlKey || e.metaKey) {
          onAdjustScaleX(-0.05);
        } else {
          onAdjustScaleBoth(-0.05);
        }
      }
      // ESC to close
      else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      // R to reset
      else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAdjustPosition, onAdjustScaleX, onAdjustScaleY, onAdjustScaleBoth, onClose, onReset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    onAdjustPosition(deltaX, deltaY);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStart.x;
    const deltaY = e.touches[0].clientY - dragStart.y;
    onAdjustPosition(deltaX, deltaY);
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30 pointer-events-auto" />

      {/* Resolution and Settings Info - Top Left */}
      <div className="absolute top-4 left-4 bg-gray-900 bg-opacity-95 text-white p-4 rounded-lg shadow-lg pointer-events-auto max-w-xs">
        <h3 className="text-lg font-bold mb-3 text-blue-400">Display Settings</h3>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Resolution:</span>
            <span className="font-mono">
              {resolution.width} × {resolution.height}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Device Pixel Ratio:</span>
            <span className="font-mono">{resolution.dpr.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Physical:</span>
            <span className="font-mono text-xs">
              {Math.round(resolution.width * resolution.dpr)} ×{' '}
              {Math.round(resolution.height * resolution.dpr)}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Scale X:</span>
            <span className="font-mono">{(settings.scaleX * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Scale Y:</span>
            <span className="font-mono">{(settings.scaleY * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Position:</span>
            <span className="font-mono text-xs">
              X: {settings.offsetX.toFixed(0)}, Y: {settings.offsetY.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Control Panel - Bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-95 text-white rounded-lg shadow-lg pointer-events-auto">
        <div className="p-4">
          {/* Scale Controls */}
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-2">Scale Horizontal (X)</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAdjustScaleX(-0.05)}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm font-bold transition-colors"
              >
                −
              </button>
              <button
                onClick={() => onAdjustScaleX(-0.01)}
                className="bg-gray-700 hover:bg-gray-600 px-2 py-2 rounded text-xs transition-colors"
              >
                −
              </button>
              <span className="font-mono text-sm w-16 text-center">
                {(settings.scaleX * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => onAdjustScaleX(0.01)}
                className="bg-gray-700 hover:bg-gray-600 px-2 py-2 rounded text-xs transition-colors"
              >
                +
              </button>
              <button
                onClick={() => onAdjustScaleX(0.05)}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Scale Y Controls */}
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-2">Scale Vertical (Y)</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAdjustScaleY(-0.05)}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm font-bold transition-colors"
              >
                −
              </button>
              <button
                onClick={() => onAdjustScaleY(-0.01)}
                className="bg-gray-700 hover:bg-gray-600 px-2 py-2 rounded text-xs transition-colors"
              >
                −
              </button>
              <span className="font-mono text-sm w-16 text-center">
                {(settings.scaleY * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => onAdjustScaleY(0.01)}
                className="bg-gray-700 hover:bg-gray-600 px-2 py-2 rounded text-xs transition-colors"
              >
                +
              </button>
              <button
                onClick={() => onAdjustScaleY(0.05)}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Scale Both Controls */}
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-2">Scale Both (X + Y)</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAdjustScaleBoth(-0.05)}
                className="bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded text-sm font-bold transition-colors"
              >
                −
              </button>
              <button
                onClick={() => onAdjustScaleBoth(-0.01)}
                className="bg-blue-700 hover:bg-blue-600 px-2 py-2 rounded text-xs transition-colors"
              >
                −
              </button>
              <span className="font-mono text-sm w-24 text-center">
                {(settings.scaleX * 100).toFixed(0)}% × {(settings.scaleY * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => onAdjustScaleBoth(0.01)}
                className="bg-blue-700 hover:bg-blue-600 px-2 py-2 rounded text-xs transition-colors"
              >
                +
              </button>
              <button
                onClick={() => onAdjustScaleBoth(0.05)}
                className="bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded text-sm font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Position Controls */}
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-2">Position (or drag content)</label>
            <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
              <div></div>
              <button
                onClick={() => onAdjustPosition(0, -10)}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors"
              >
                ↑
              </button>
              <div></div>
              <button
                onClick={() => onAdjustPosition(-10, 0)}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors"
              >
                ←
              </button>
              <button
                onClick={() => onAdjustPosition(0, 0)}
                className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded transition-colors text-xs"
                title="Center"
              >
                ●
              </button>
              <button
                onClick={() => onAdjustPosition(10, 0)}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors"
              >
                →
              </button>
              <div></div>
              <button
                onClick={() => onAdjustPosition(0, 10)}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition-colors"
              >
                ↓
              </button>
              <div></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 border-t border-gray-700">
            <button
              onClick={onReset}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-sm font-semibold transition-colors"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="bg-gray-800 px-4 py-3 rounded-b-lg border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center mb-1">Keyboard Shortcuts</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <span className="text-gray-500">Arrow Keys</span>
            <span className="text-gray-400">Move</span>
            <span className="text-gray-500">+/−</span>
            <span className="text-gray-400">Scale Both</span>
            <span className="text-gray-500">Ctrl +/−</span>
            <span className="text-gray-400">Scale X</span>
            <span className="text-gray-500">Shift +/−</span>
            <span className="text-gray-400">Scale Y</span>
            <span className="text-gray-500">R</span>
            <span className="text-gray-400">Reset</span>
            <span className="text-gray-500">ESC</span>
            <span className="text-gray-400">Close</span>
          </div>
        </div>
      </div>

      {/* Drag overlay for touch/mouse - only active when dragging */}
      {isDragging && (
        <div
          className="absolute inset-0 cursor-move pointer-events-auto z-50"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      )}

      {/* Drag instruction overlay - only in empty areas, not over controls */}
      {!isDragging && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'transparent' }}>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center pointer-events-auto cursor-move px-8 py-4"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <p className="text-lg font-semibold bg-black bg-opacity-50 px-4 py-2 rounded">
              Click and drag to reposition
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
