import { cn } from "@/lib/utils/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gray-200",
        className
      )}
    />
  );
}

// Skeleton for a group card in the dashboard
export function GroupCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-5 w-5 rounded" />
      </div>
    </div>
  );
}

// Skeleton for an expense card
export function ExpenseCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

// Skeleton for balance summary
export function BalanceSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton for profile page
export function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center space-y-4 py-8">
      <Skeleton className="h-20 w-20 rounded-full" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

// List skeleton that renders multiple items
export function ListSkeleton({
  count = 3,
  ItemComponent = GroupCardSkeleton
}: {
  count?: number;
  ItemComponent?: React.ComponentType;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ItemComponent key={i} />
      ))}
    </div>
  );
}
