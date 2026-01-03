import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { signageApi } from '../../services/api';
import { wsService } from '../../services/websocket';
import { useContentRotation } from '../../hooks/useContentRotation';
import { PlayerStatsCard } from './PlayerStatsCard';
import { MediaContent } from './MediaContent';
import { ContentType } from '@shared/types';

export const SignageDisplay = () => {
  const [shouldRefetch, setShouldRefetch] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: signageData, refetch } = useQuery({
    queryKey: ['signageData', shouldRefetch],
    queryFn: async () => {
      const response = await signageApi.getActiveData();
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute as backup
  });

  useEffect(() => {
    wsService.connect();

    wsService.onSessionChange(() => {
      console.log('Session changed, refetching data...');
      setShouldRefetch((prev: number) => prev + 1);
      refetch();
    });

    wsService.onContentUpdate(() => {
      console.log('Content updated, refetching data...');
      refetch();
    });

    return () => {
      wsService.disconnect();
    };
  }, [refetch]);

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
    hours = hours ? hours : 12; // 0 should be 12

    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');

    return `${hh}:${mm}:${ss} ${ampm}`;
  };

  const { currentContent, isTransitioning, setVideoDuration, progress } = useContentRotation({
    content,
    fallbackContent,
  });

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
    <div className="relative w-full h-screen overflow-hidden">
      <div
        className={`dissolve-transition ${isTransitioning ? 'dissolve-exit-active' : 'dissolve-enter-active'}`}
        style={{ opacity: isTransitioning ? 0 : 1 }}
      >
        {renderContent()}
      </div>

      {/* Current Time Display */}
      <div
        className={`absolute top-8 right-8 bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg`}
      >
        <p className="text-2xl font-mono font-semibold">{formatTime(currentTime)}</p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800 bg-opacity-50">
        <div
          className="h-full bg-blue-500 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
