import { useEffect, useRef } from 'react';

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
        <img src={filePath} alt={title} className="max-w-full max-h-full object-contain" />
      ) : (
        <video
          ref={videoRef}
          src={filePath}
          autoPlay
          loop
          muted
          className="max-w-full max-h-full object-contain"
        />
      )}
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <h2 className="text-4xl font-bold text-white bg-black bg-opacity-50 px-8 py-4 inline-block rounded-lg">
          {title}
        </h2>
      </div>
    </div>
  );
};
