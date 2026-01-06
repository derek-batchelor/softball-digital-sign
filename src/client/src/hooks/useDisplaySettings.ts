import { useState, useEffect } from 'react';

export interface DisplaySettings {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

const DEFAULT_SETTINGS: DisplaySettings = {
  scaleX: 1,
  scaleY: 1,
  offsetX: 0,
  offsetY: 0,
};

const STORAGE_KEY = 'signage-display-settings';

export const useDisplaySettings = () => {
  const [settings, setSettings] = useState<DisplaySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load display settings:', error);
    }
    return DEFAULT_SETTINGS;
  });

  const [resolution, setResolution] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1,
  });

  useEffect(() => {
    const handleResize = () => {
      setResolution({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateSettings = (newSettings: Partial<DisplaySettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save display settings:', error);
      }
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset display settings:', error);
    }
  };

  const adjustScaleX = (delta: number) => {
    updateSettings({ scaleX: Math.max(0.1, Math.min(3, settings.scaleX + delta)) });
  };

  const adjustScaleY = (delta: number) => {
    updateSettings({ scaleY: Math.max(0.1, Math.min(3, settings.scaleY + delta)) });
  };

  const adjustScaleBoth = (delta: number) => {
    updateSettings({
      scaleX: Math.max(0.1, Math.min(3, settings.scaleX + delta)),
      scaleY: Math.max(0.1, Math.min(3, settings.scaleY + delta)),
    });
  };

  const adjustPosition = (deltaX: number, deltaY: number) => {
    updateSettings({
      offsetX: settings.offsetX + deltaX,
      offsetY: settings.offsetY + deltaY,
    });
  };

  return {
    settings,
    resolution,
    updateSettings,
    resetSettings,
    adjustScaleX,
    adjustScaleY,
    adjustScaleBoth,
    adjustPosition,
  };
};
