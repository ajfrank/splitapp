"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadMoreProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  totalLoaded: number;
  totalCount?: number;
}

export function LoadMoreButton({
  hasMore,
  loading,
  onLoadMore,
  totalLoaded,
  totalCount,
}: LoadMoreProps) {
  if (!hasMore) return null;

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={loading}
        className="w-full max-w-xs"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4 mr-2" />
            Load More
          </>
        )}
      </Button>
      {totalCount !== undefined && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Showing {totalLoaded} of {totalCount}
        </p>
      )}
    </div>
  );
}

interface InfiniteScrollTriggerProps {
  onTrigger: () => void;
  hasMore: boolean;
  loading: boolean;
}

export function useInfiniteScroll({
  onTrigger,
  hasMore,
  loading,
}: InfiniteScrollTriggerProps) {
  const handleScroll = () => {
    if (loading || !hasMore) return;

    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Trigger when within 200px of the bottom
    if (documentHeight - scrollTop - windowHeight < 200) {
      onTrigger();
    }
  };

  return { handleScroll };
}
