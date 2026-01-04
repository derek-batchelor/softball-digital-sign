import { useEffect, useRef } from 'react';
import { config } from '../../config';

interface MediaContentProps {
  filePath: string;
  title: string;
  type: 'image' | 'video';
  onVideoDurationDetected?: (duration: number) => void;
}

export const MediaContent = ({
  filePath,
  title,
  type,
  onVideoDurationDetected,
}: MediaContentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (type === 'video' && videoRef.current) {
      const handleLoadedMetadata = () => {
        if (videoRef.current && onVideoDurationDetected) {
          onVideoDurationDetected(videoRef.current.duration);
        }
      };

      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);

      return () => {
        videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [type, onVideoDurationDetected]);

  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center">
      {type === 'image' ? (
        <img
          src={`${config.apiUrl}${filePath}`}
          alt={title}
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <video
          ref={videoRef}
          src={`${config.apiUrl}${filePath}`}
          autoPlay
          loop
          muted
          className="max-w-full max-h-full object-contain"
        />
      )}
      <div className="absolute bottom-4 sm:bottom-8 md:bottom-12 left-0 right-0 text-center px-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white bg-black bg-opacity-50 px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 inline-block rounded-lg max-w-full">
          {title}
        </h2>
      </div>
    </div>
  );
};
