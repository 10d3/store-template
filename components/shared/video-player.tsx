import React from "react";

interface VideoPlayerProps {
  src: string;
  poster: string;
  width: string;
  height: string;
  controls: boolean;
  onEnded: () => void;
}

const VideoPlayer = ({
  src,
  poster,
  width,
  height,
  controls,
  onEnded,
}: VideoPlayerProps) => {
  return (
    <video
      width={width}
      height={height}
      controls={controls}
      poster={poster}
      onEnded={onEnded}
      src={src}
    >
      <source src={src} type="video/mp4" />
      Votre navigateur ne supporte pas la vidéo.
    </video>
  );
};

export default VideoPlayer;
