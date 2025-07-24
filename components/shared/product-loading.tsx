"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-white m-0 p-0">
      <CardContent className="p-0 m-0 relative">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Skeleton className="w-full h-full" />
          
          {/* Price skeleton */}
          <div className="absolute bottom-4 left-4 right-4">
            <Skeleton className="h-6 w-20 bg-gray-300" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PackCardSkeleton() {
  return (
    <Card className="m-0 p-0 bg-card relative rounded-lg overflow-hidden">
      <CardContent className="m-0 p-0 relative">
        <div className="grid grid-cols-2 gap-1 rounded-lg">
          {[1, 2].map((i) => (
            <div key={i} className="relative aspect-square overflow-hidden">
              <Skeleton className="w-full h-full" />
            </div>
          ))}
        </div>
        
        {/* Center button skeleton */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="rounded-full w-14 h-14" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        {/* Products skeleton */}
        <div className="mb-16">
          <Skeleton className="h-8 w-48 mx-auto mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Packs skeleton */}
        <div>
          <Skeleton className="h-8 w-32 mx-auto mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <PackCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}