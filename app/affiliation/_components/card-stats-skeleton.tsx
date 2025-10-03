import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CardStatsSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-[100px]" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[80px]" />
            <Skeleton className="h-4 w-[40px]" />
          </div>
          <Skeleton className="h-[200px] w-full" />
        </div>
      </CardContent>
    </Card>
  );
}