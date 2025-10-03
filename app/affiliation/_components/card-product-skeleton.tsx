import { Skeleton } from "@/components/ui/skeleton";

export default function CardProductSkeleton() {
  return (
    <div className="flex items-center gap-12 rounded-2xl bg-card p-6 shadow-sm">
      {/* Product Info */}
      <div className="flex-1">
        <Skeleton className="h-6 w-[200px] mb-2" />
        <Skeleton className="h-4 w-[150px]" />
      </div>

      {/* Metrics */}
      <div className="flex gap-12">
        <div>
          <Skeleton className="h-4 w-[80px] mb-2" />
          <Skeleton className="h-8 w-[60px]" />
        </div>
        <div>
          <Skeleton className="h-4 w-[80px] mb-2" />
          <Skeleton className="h-8 w-[60px]" />
        </div>
        <div>
          <Skeleton className="h-4 w-[80px] mb-2" />
          <Skeleton className="h-8 w-[60px]" />
        </div>
      </div>
    </div>
  );
}