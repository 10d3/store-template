"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "../ui/carousel";
import VideoPlayer from "./video-player";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function CarouselComponent({
  className,
}: {
  className?: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [preloadedVideos, setPreloadedVideos] = useState<Set<number>>(
    new Set()
  );
  const [restartTrigger, setRestartTrigger] = useState<{
    [key: number]: boolean;
  }>({});
  const preloadRefs = useRef<{ [key: number]: HTMLVideoElement }>({});

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      const newIndex = api.selectedScrollSnap();
      setCurrent(newIndex);
      // Preload next video when slide changes
      preloadNextVideo(newIndex);
    });

    // Preload the first video on mount
    preloadNextVideo(0);
  }, [api]);

  // Preload next video function
  const preloadNextVideo = (currentIndex: number) => {
    const nextIndex = (currentIndex + 1) % items.length;
    const nextItem = items[nextIndex];

    // Only preload if it's a video and hasn't been preloaded yet
    if (nextItem.type === "video" && !preloadedVideos.has(nextIndex)) {
      console.log(`Preloading video at index ${nextIndex}:`, nextItem.src);

      // Create a hidden video element for preloading
      const preloadVideo = document.createElement("video");
      preloadVideo.preload = "auto";
      preloadVideo.muted = true;
      preloadVideo.style.display = "none";
      preloadVideo.src = nextItem.src;

      // Store reference for cleanup
      preloadRefs.current[nextIndex] = preloadVideo;

      // Add to DOM to start loading
      document.body.appendChild(preloadVideo);

      // Handle preload events
      preloadVideo.addEventListener("canplaythrough", () => {
        console.log(`Video ${nextIndex} preloaded successfully`);
        setPreloadedVideos((prev) => new Set([...prev, nextIndex]));
      });

      preloadVideo.addEventListener("error", (e) => {
        console.error(`Failed to preload video ${nextIndex}:`, e);
        // Clean up failed preload
        if (preloadRefs.current[nextIndex]) {
          document.body.removeChild(preloadRefs.current[nextIndex]);
          delete preloadRefs.current[nextIndex];
        }
      });
    }
  };

  // Cleanup preloaded videos when component unmounts
  useEffect(() => {
    return () => {
      Object.values(preloadRefs.current).forEach((video) => {
        if (video && video.parentNode) {
          video.parentNode.removeChild(video);
        }
      });
    };
  }, []);
  // Function to restart a video
  const restartVideo = (index: number) => {
    console.log(`Restarting video at index ${index}`);
    setRestartTrigger((prev) => ({
      ...prev,
      [index]: !prev[index], // Toggle to trigger useEffect
    }));
  };

  // Function to handle thumbnail clicks
  const handleThumbnailClick = (index: number) => {
    if (api) {
      // If clicking on current slide and it's a video, restart it
      if (index === current && items[index].type === "video") {
        restartVideo(index);
      } else {
        // Navigate to the clicked slide
        api.scrollTo(index);
      }
    }
  };
  const onVideoEnd = (videoIndex: number) => {
    console.log(`Video at index ${videoIndex} has ended`);

    // You can add custom logic here when a video ends
    // For example, automatically advance to next slide:
    if (api) {
      setTimeout(() => {
        api.scrollNext();
      }, 500); // Small delay before advancing
    }

    // Or trigger other actions like analytics, loading next content, etc.
    handleVideoCompletion(videoIndex);
  };

  // Custom handler for when video completes
  const handleVideoCompletion = (index: number) => {
    const item = items[index];
    console.log(`Video completed:`, {
      index,
      src: item.src,
      type: item.type,
      timestamp: new Date().toISOString(),
      wasPreloaded: preloadedVideos.has(index),
    });

    // Preload the next video after current one ends
    preloadNextVideo(index);

    // Add your custom logic here:
    // - Track analytics
    // - Show completion UI
    // - Save progress
    // etc.
  };

  const items = [
    {
      type: "video",
      src: "https://cuajuep66z.ufs.sh/f/ZuLpxltn4GuJU3jCQdB2l6tPHkBKI7CAj5Z3c1yXdMTgiumq",
      poster:
        "https://6ay8a7s9vf.ufs.sh/f/XID4kzR81z3MMnd2XdSwtNrIdlDQOqySUF8bJAxeVMZT2Hg0",
      width: 1280,
      height: 720,
      alt:"poster carousel"
    },
    {
      type: "video",
      src: "https://cuajuep66z.ufs.sh/f/ZuLpxltn4GuJFptlJYIyTZNuDsJjvkfhUWo2ySimKIVX7Ye1",
      poster:
        "https://6ay8a7s9vf.ufs.sh/f/XID4kzR81z3MYC4LM9Irtc1DTM7O6HaZCyVwnKUWesNpfi9u",
      width: 1280,
      height: 720,
      alt:"poster carousel"
    },
    {
      type: "video",
      src: "https://cuajuep66z.ufs.sh/f/ZuLpxltn4GuJU3jCQdB2l6tPHkBKI7CAj5Z3c1yXdMTgiumq",
      poster:
        "https://6ay8a7s9vf.ufs.sh/f/XID4kzR81z3MMnd2XdSwtNrIdlDQOqySUF8bJAxeVMZT2Hg0",
      width: 1280,
      height: 720,
      alt:"poster carousel"
    },
  ];

  return (
    <main className={cn("w-full h-fit relative", className)}>
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
        }}
      >
        <CarouselContent className="w-full h-fit">
          {items.map((item, i) =>
            item.type === "image" ? (
              <CarouselItem key={i}>
                <Image
                  src={item.src}
                  alt={item.type === "image" ? item.alt : "carousel image"}
                  width={item.width as number}
                  height={item.height as number}
                />
              </CarouselItem>
            ) : (
              <CarouselItem key={i}>
                <VideoPlayer
                  src={item.src}
                  poster={item.poster as string}
                  width={item.width?.toString() as string}
                  height={item.height?.toString() as string}
                  controls={false}
                  onEnded={() => onVideoEnd(i)}
                  isPreloaded={preloadedVideos.has(i)}
                  shouldRestart={restartTrigger[i]}
                  onTimeUpdate={(progress, currentTime, duration) => {
                    // You can use this for progress bars or analytics
                    console.log(currentTime, duration);
                    console.log(`Video ${i} progress: ${progress.toFixed(1)}%`);
                  }}
                  onLoadStart={() => {
                    console.log(`Video ${i} started loading`);
                  }}
                  onCanPlay={() => {
                    console.log(`Video ${i} ready to play`);
                  }}
                />
              </CarouselItem>
            )
          )}
        </CarouselContent>
      </Carousel>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center justify-center">
          {items.map((item, i) => (
            <div
              key={i}
              className={cn(
                "size-16 rounded-lg mx-1 border-2 overflow-hidden cursor-pointer",
                current === i ? "border-white" : "border-background"
              )}
              onClick={() => handleThumbnailClick(i)}
            >
              <Image
                src={
                  item.type === "image"
                    ? (item.src as string)
                    : (item.poster as string)
                }
                alt={`${item.alt} carrousel thumbnail`}
                width={1000}
                height={1000}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
