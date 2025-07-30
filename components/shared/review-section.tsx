"use client";

import { useState, useEffect } from "react";
import { Play, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface VideoReview {
  id: string;
  reviewer: {
    name: string;
    avatar?: string;
    initials: string;
  };
  rating: number;
  title: string;
  videoUrl: string;
  thumbnail: string;
  date: string;
  size: "small" | "medium" | "large" | "wide" | "tall";
}

const videoReviews: VideoReview[] = [
  {
    id: "1",
    reviewer: { name: "Sarah Johnson", initials: "SJ" },
    rating: 5,
    title: "Absolutely love this product!",
    videoUrl: "/placeholder-video.mp4",
    thumbnail: "/placeholder.svg?height=300&width=400&text=Product+Review",
    date: "2 days ago",
    size: "medium",
  },
  {
    id: "2",
    reviewer: { name: "Michael Chen", initials: "MC" },
    rating: 4,
    title: "Great quality",
    videoUrl: "/placeholder-video.mp4",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Quality+Test",
    date: "1 week ago",
    size: "small",
  },
  {
    id: "3",
    reviewer: { name: "Emma Davis", initials: "ED" },
    rating: 5,
    title: "Perfect for my daily routine, couldn't be happier",
    videoUrl: "/placeholder-video.mp4",
    thumbnail: "/placeholder.svg?height=400&width=300&text=Daily+Use",
    date: "2 weeks ago",
    size: "tall",
  },
  {
    id: "4",
    reviewer: { name: "James Wilson", initials: "JW" },
    rating: 4,
    title: "Solid build quality and amazing design",
    videoUrl: "/placeholder-video.mp4",
    thumbnail: "/placeholder.svg?height=250&width=500&text=Build+Quality",
    date: "3 weeks ago",
    size: "wide",
  },
  {
    id: "5",
    reviewer: { name: "Lisa Rodriguez", initials: "LR" },
    rating: 5,
    title: "Exceeded expectations",
    videoUrl: "/placeholder-video.mp4",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Expectations",
    date: "1 month ago",
    size: "small",
  },
  {
    id: "6",
    reviewer: { name: "David Kim", initials: "DK" },
    rating: 4,
    title: "Impressive features and performance",
    videoUrl: "/placeholder-video.mp4",
    thumbnail: "/placeholder.svg?height=350&width=400&text=Performance",
    date: "1 month ago",
    size: "large",
  },
  {
    id: "7",
    reviewer: { name: "Anna Thompson", initials: "AT" },
    rating: 5,
    title: "Best purchase this year",
    videoUrl: "/placeholder-video.mp4",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Best+Purchase",
    date: "2 months ago",
    size: "small",
  },
  {
    id: "8",
    reviewer: { name: "Robert Lee", initials: "RL" },
    rating: 4,
    title: "Highly recommend to everyone",
    videoUrl: "/placeholder-video.mp4",
    thumbnail: "/placeholder.svg?height=300&width=500&text=Recommendation",
    date: "2 months ago",
    size: "wide",
  },
  {
    id: "9",
    reviewer: { name: "Maria Garcia", initials: "MG" },
    rating: 5,
    title: "Outstanding quality",
    videoUrl: "/placeholder-video.mp4",
    thumbnail: "/placeholder.svg?height=300&width=400&text=Outstanding",
    date: "3 months ago",
    size: "medium",
  },
  {
    id: "10",
    reviewer: { name: "Tom Wilson", initials: "TW" },
    rating: 4,
    title: "Great value for money",
    videoUrl: "/placeholder-video.mp4",
    thumbnail: "/placeholder.svg?height=200&width=300&text=Great+Value",
    date: "3 months ago",
    size: "small",
  },
  {
    id: "11",
    reviewer: { name: "Sophie Chen", initials: "SC" },
    rating: 5,
    title: "Elegant design meets functionality",
    videoUrl: "/placeholder-video.mp4",
    thumbnail: "/placeholder.svg?height=400&width=300&text=Elegant+Design",
    date: "4 months ago",
    size: "tall",
  },
  {
    id: "12",
    reviewer: { name: "Alex Rivera", initials: "AR" },
    rating: 4,
    title: "Seamless experience",
    videoUrl: "/placeholder-video.mp4",
    thumbnail: "/placeholder.svg?height=350&width=400&text=Seamless",
    date: "4 months ago",
    size: "large",
  },
];

export default function VideoReviewMasonry() {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById("masonry-container");
      if (container) {
        setContainerWidth(container.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < rating ? "fill-slate-800 text-slate-800" : "text-slate-300"}`}
      />
    ));
  };

  const handlePlayVideo = (videoId: string) => {
    setPlayingVideo(playingVideo === videoId ? null : videoId);
  };

  // Dynamic grid configuration based on container width
  const getGridConfig = () => {
    if (containerWidth < 640) return { cols: 2, baseSize: 140 };
    if (containerWidth < 1024) return { cols: 3, baseSize: 160 };
    if (containerWidth < 1280) return { cols: 4, baseSize: 180 };
    if (containerWidth < 1536) return { cols: 5, baseSize: 200 };
    return { cols: 6, baseSize: 220 };
  };

  const { cols, baseSize } = getGridConfig();

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "small":
        return "col-span-1 row-span-1";
      case "medium":
        return "col-span-1 row-span-2";
      case "large":
        return `col-span-${Math.min(2, cols)} row-span-2`;
      case "wide":
        return `col-span-${Math.min(2, cols)} row-span-1`;
      case "tall":
        return "col-span-1 row-span-3";
      default:
        return "col-span-1 row-span-1";
    }
  };

  return (
    <div className="min-h-screen w-full">
      {/* Header Section */}
      <div className="pt-16 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-light mb-4 tracking-tight">
            Customer Stories
          </h1>
          <p className="text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Authentic experiences shared by our community through their own lens
          </p>
        </div>
      </div>

      {/* Main Gallery */}
      <div className="px-6 pb-16">
        <div className="max-w-7xl mx-auto" id="masonry-container">
          {/* Dynamic Masonry Grid */}
          <div
            className="grid gap-4 md:gap-6"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridAutoRows: `${baseSize}px`,
            }}
          >
            {videoReviews.map((review) => (
              <Card
                key={review.id}
                className={`group overflow-hidden border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer p-0 ${getSizeClasses(review.size)}`}
                onClick={() => handlePlayVideo(review.id)}
              >
                <CardContent className="p-0 h-full relative">
                  {/* Video Thumbnail */}
                  <div className="relative w-full h-full overflow-hidden">
                    <Image
                      width={1000}
                      height={1000}
                      src={review.thumbnail || "/placeholder.svg"}
                      alt={`Video review by ${review.reviewer.name}`}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                    />

                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-all duration-500" />

                    {/* Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Button
                        size="lg"
                        className="rounded-full w-14 h-14 bg-white/95 hover:bg-white text-slate-900 shadow-lg border-0 backdrop-blur-sm"
                      >
                        <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
                      </Button>
                    </div>

                    {/* Video Player (when playing) */}
                    {playingVideo === review.id && (
                      <div className="absolute inset-0 bg-slate-900 z-10">
                        <video
                          className="w-full h-full object-cover"
                          controls
                          autoPlay
                          onEnded={() => setPlayingVideo(null)}
                        >
                          <source src={review.videoUrl} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )}

                    {/* Review Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 via-white/90 to-transparent p-4 md:p-6">
                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2">
                        {renderStars(review.rating)}
                      </div>

                      {/* Title */}
                      <h3 className="text-slate-900 text-sm md:text-base font-medium mb-3 line-clamp-2 leading-snug">
                        {review.title}
                      </h3>

                      {/* Reviewer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-6 h-6 md:w-8 md:h-8">
                            <AvatarFallback className="text-xs bg-slate-100 text-slate-700 font-medium">
                              {review.reviewer.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-slate-700 text-sm font-medium">
                            {review.reviewer.name}
                          </span>
                        </div>
                        <span className="text-slate-500 text-xs">
                          {review.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
