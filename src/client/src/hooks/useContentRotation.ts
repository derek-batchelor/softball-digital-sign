import { useState, useEffect } from 'react';
import { SignageContent, ContentType } from '@shared/types';

interface ContentRotationProps {
  content: SignageContent[];
  fallbackContent: SignageContent[];
}

export const useContentRotation = ({ content, fallbackContent }: ContentRotationProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [waitingForVideo, setWaitingForVideo] = useState(false);

  // Use unified content if available, otherwise fallback
  const activeContent = content.length > 0 ? content : fallbackContent;
  const currentContent = activeContent[currentIndex];

  useEffect(() => {
    if (!currentContent) return;

    console.log('🔄 Content Rotation Timer Starting:', {
      title: currentContent.title,
      contentType: currentContent.contentType,
      serverDuration: currentContent.duration,
      videoDurationDetected: videoDuration,
      waitingForVideo,
    });

    // Get duration from server
    let duration = currentContent.duration * 1000; // Convert to milliseconds

    // If duration is -1 (video), wait for client to detect actual duration
    if (currentContent.duration === -1) {
      if (currentContent.contentType === ContentType.VIDEO) {
        // Wait for video metadata to load
        if (!videoDuration) {
          console.log('⏸️ Waiting for video metadata...');
          setWaitingForVideo(true);
          return; // Exit early, will restart when videoDuration is set
        }
        duration = videoDuration * 1000;
        setWaitingForVideo(false);
        console.log('▶️ Video duration detected:', videoDuration, 'seconds');
      } else {
        // Fallback: if somehow -1 is set for non-video, use 30 seconds
        duration = 30000;
      }
    }

    console.log('⏱️ Final duration for rotation:', duration / 1000, 'seconds');

    // Reset progress
    setProgress(0);

    // Update progress every 100ms
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
    }, 100);

    const timer = setTimeout(() => {
      setIsTransitioning(true);

      // After 1s dissolve transition, change content
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activeContent.length);
        setIsTransitioning(false);
        setVideoDuration(null); // Reset video duration for next content
      }, 1000); // 1s dissolve duration
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [currentIndex, currentContent, activeContent.length, videoDuration, waitingForVideo]);

  // Reset index when content changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsTransitioning(false);
  }, [content, fallbackContent]);

  // Preload next images to prevent flickering during transitions
  useEffect(() => {
    if (activeContent.length <= 1) return;

    const preloadContent = () => {
      // Preload next 2 pieces of content in the rotation
      for (let i = 1; i <= 2; i++) {
        const nextIndex = (currentIndex + i) % activeContent.length;
        const nextContent = activeContent[nextIndex];

        // Preload player photos if available
        if (nextContent?.player?.photoPath) {
          const img = new Image();
          img.src = nextContent.player.photoPath;
        }

        // Preload image content
        if (nextContent?.filePath && nextContent.contentType === 'IMAGE') {
          const img = new Image();
          img.src = nextContent.filePath;
        }

        // Preload videos by creating hidden video element
        if (nextContent?.filePath && nextContent.contentType === 'VIDEO') {
          const videoId = `preload-video-${nextIndex}`;
          let video = document.getElementById(videoId) as HTMLVideoElement;

          // Only create if it doesn't already exist
          if (!video) {
            video = document.createElement('video');
            video.id = videoId;
            video.src = nextContent.filePath;
            video.preload = 'auto';
            video.muted = true;
            video.style.display = 'none';
            document.body.appendChild(video);

            // Remove after metadata loads
            const handleLoaded = () => {
              setTimeout(() => video.remove(), 100);
            };
            video.addEventListener('loadedmetadata', handleLoaded, { once: true });
          }
        }
      }
    };

    preloadContent();
  }, [currentIndex, activeContent]);

  return {
    currentContent,
    isTransitioning,
    setVideoDuration,
    progress,
  };
};
