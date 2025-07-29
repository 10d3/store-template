/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useEffect } from "react";

interface VideoPlayerProps {
  src: string;
  poster: string;
  width: string;
  height: string;
  controls: boolean;
  onEnded: () => void;
  onTimeUpdate?: (
    progress: number,
    currentTime: number,
    duration: number
  ) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  isPreloaded?: boolean;
  shouldRestart?: boolean;
}

const VideoPlayer = ({
  src,
  poster,
  width,
  height,
  controls = false,
  onEnded,
  onTimeUpdate,
  onLoadStart,
  onCanPlay,
  isPreloaded = false,
  shouldRestart = false,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // If video is preloaded, we can start playing immediately
    if (isPreloaded) {
      console.log("Using preloaded video for:", src);
    }
  }, [src, isPreloaded]);

  // Handle restart when shouldRestart prop changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldRestart) return;

    console.log("Restarting video:", src);
    video.currentTime = 0;
    video.play().catch(console.error);
  }, [shouldRestart, src]);

  const handleEnded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.log("Video ended:", src);
    onEnded();
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!onTimeUpdate) return;

    const video = e.currentTarget;
    if (video.duration) {
      const progress = (video.currentTime / video.duration) * 100;
      onTimeUpdate(progress, video.currentTime, video.duration);
    }
  };

  const handleLoadStart = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.log("Video load started:", src);
    onLoadStart?.();
  };

  const handleCanPlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.log("Video can play:", src);
    onCanPlay?.();
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error("Video error:", src, e.currentTarget.error);
  };

  const handleClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;

    // If video has ended or is paused, restart it
    if (video.ended || video.paused) {
      console.log("Restarting video on click:", src);
      video.currentTime = 0;
      video.play().catch(console.error);
    } else {
      // If playing, pause it (optional - remove if you don't want pause functionality)
      video.pause();
    }
  };

  return (
    <video
      ref={videoRef}
      width={width}
      height={height}
      controls={controls}
      poster={poster}
      onEnded={handleEnded}
      onTimeUpdate={handleTimeUpdate}
      onLoadStart={handleLoadStart}
      onCanPlay={handleCanPlay}
      onError={handleError}
      onClick={handleClick}
      src={src}
      autoPlay={true}
      muted={true}
      preload="auto" // Ensure videos preload metadata
      style={{ cursor: "pointer" }} // Show it's clickable
    >
      <source src={src} type="video/mp4" />
      Votre navigateur ne supporte pas la vidéo.
    </video>
  );
};

export default VideoPlayer;
