import Image from "next/image";
import React from "react";

interface MediaItem {
  id: string;
  type: "image" | "video";
  src: string;
  thumbnail?: string;
  alt: string;
  title?: string;
}

export default function MediaGallery({
  mediaItems,
  getGridPosition,
}: {
  mediaItems: MediaItem[];
  getGridPosition: (index: number) => string;
  variant: "default" | "compact";
}) {
  return (
    <div
      className="grid grid-cols-4 gap-4 h-auto"
      style={{ gridAutoRows: "200px" }}
    >
      {mediaItems.map((item, index) => (
        <div
          key={item.id}
          className={`group overflow-hidden rounded-lg ${getGridPosition(index)}`}
        >
          {item.type === "image" ? (
            <Image
              width={1000}
              height={1000}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
              src={item.src}
              alt={item.alt}
            />
          ) : (
            <div className="relative w-full h-full">
              <Image
                width={1000}
                height={1000}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                src={item.thumbnail || item.src}
                alt={item.alt}
              />
              {/* Video Play Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-800 ml-0.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {/* Title overlay for videos */}
              {item.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                  <p className="text-white text-sm font-medium">{item.title}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
