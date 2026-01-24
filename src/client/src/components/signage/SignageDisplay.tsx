import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { signageApi } from '../../services/api';
import { useContentRotation } from '../../hooks/useContentRotation';
import { useDisplaySettings } from '../../hooks/useDisplaySettings';
import { PlayerStatsCard } from './PlayerStatsCard';
import { MediaContent } from './MediaContent';
import { DisplaySettingsPanel } from '../shared/DisplaySettingsPanel';
import { LoadingState } from '../shared/LoadingState';
import { ContentType } from '@shared/types';

export const SignageDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);

  const {
    settings: displaySettings,
    resolution,
    adjustScaleX,
    adjustScaleY,
    adjustScaleBoth,
    adjustPosition,
    resetSettings,
  } = useDisplaySettings();

  // Toggle settings panel with long press (3 seconds) on screen
  useEffect(() => {
    let pressTimer: NodeJS.Timeout | null = null;

    const toggleSettings = () => {
      setShowSettings((prev) => !prev);
    };

    const startPressTimer = () => {
      pressTimer = setTimeout(toggleSettings, 3000);
    };

    const clearPressTimer = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    const globalTarget = globalThis as typeof globalThis & {
      addEventListener?: Window['addEventListener'];
      removeEventListener?: Window['removeEventListener'];
    };

    if (!globalTarget.addEventListener || !globalTarget.removeEventListener) {
      return undefined;
    }

    globalTarget.addEventListener('mousedown', startPressTimer);
    globalTarget.addEventListener('mouseup', clearPressTimer);
    globalTarget.addEventListener('touchstart', startPressTimer);
    globalTarget.addEventListener('touchend', clearPressTimer);

    return () => {
      globalTarget.removeEventListener('mousedown', startPressTimer);
      globalTarget.removeEventListener('mouseup', clearPressTimer);
      globalTarget.removeEventListener('touchstart', startPressTimer);
      globalTarget.removeEventListener('touchend', clearPressTimer);
      clearPressTimer();
    };
  }, []);

  const { data: signageData, isLoading } = useQuery({
    queryKey: ['signageData'],
    queryFn: async () => {
      const response = await signageApi.getActiveData();
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute as backup
  });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Use server-provided unified content (already ordered: current/next/previous/weekend warrior, then media)
  const content = signageData?.content || [];
  const fallbackContent = signageData?.fallbackContent || [];

  // Debug logging
  useEffect(() => {
    if (signageData) {
      console.log('📊 Signage Data Received:', {
        contentCount: content.length,
        fallbackCount: fallbackContent.length,
        currentSession: signageData.currentSession ? 'Yes' : 'No',
        content: content.map((c) => `${c.title} (${c.contentType}, ${c.duration}s)`),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signageData]);

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours || 12; // 0 should be 12

    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');

    return `${hh}:${mm}:${ss} ${ampm}`;
  };

  const { currentContent, isTransitioning, setVideoDuration, progress } = useContentRotation({
    content,
    fallbackContent,
  });

  // Show loading indicator while initially fetching data
  if (isLoading) {
    return <LoadingState fullScreen tone="dark" message="Loading signage..." />;
  }

  // Show "No Content" only if data has loaded but there's no content to display
  if (!currentContent) {
    return (
      <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
        <h1 className="text-6xl font-bold text-white">No Content Available</h1>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentContent.contentType) {
      case ContentType.PLAYER_STATS: {
        return (
          <PlayerStatsCard
            player={currentContent.player}
            photoPath={currentContent.filePath}
            isWeekendWarrior={currentContent.player?.isWeekendWarrior}
          />
        );
      }

      case ContentType.IMAGE:
      case ContentType.VIDEO: {
        const fileType = currentContent.contentType === ContentType.VIDEO ? 'video' : 'image';

        return (
          <MediaContent
            filePath={currentContent.filePath || ''}
            title={currentContent.title}
            type={fileType}
            onVideoDurationDetected={setVideoDuration}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
      {/* Wrapper with actual dimension changes - includes all content and UI elements */}
      <div
        style={{
          position: 'relative',
          width: `${displaySettings.scaleX * 100}%`,
          height: `${displaySettings.scaleY * 100}%`,
          transform: `translate(${displaySettings.offsetX}px, ${displaySettings.offsetY}px)`,
          transition: 'all 0.1s ease-out',
        }}
      >
        {/* Main Content */}
        <div
          className={`dissolve-transition ${isTransitioning ? 'dissolve-exit-active' : 'dissolve-enter-active'}`}
          style={{ opacity: isTransitioning ? 0 : 1 }}
        >
          {renderContent()}
        </div>

        {/* Current Time Display */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-6 md:right-6 lg:top-8 lg:right-8 bg-black bg-opacity-70 text-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-md sm:rounded-lg">
          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-mono font-semibold">
            {formatTime(currentTime)}
          </p>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 md:h-2 bg-gray-800 bg-opacity-50">
          <div
            className="h-full bg-blue-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Settings Panel Overlay (outside transform) */}
      {showSettings && (
        <DisplaySettingsPanel
          settings={displaySettings}
          resolution={resolution}
          onAdjustScaleX={adjustScaleX}
          onAdjustScaleY={adjustScaleY}
          onAdjustScaleBoth={adjustScaleBoth}
          onAdjustPosition={adjustPosition}
          onReset={resetSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};
