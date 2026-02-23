"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  action?: React.ReactNode;
}

export function Header({ title, showBack = false, action }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-lg items-center px-4">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-2 -ml-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="flex-1 text-lg font-semibold truncate">{title}</h1>
        {action && <div className="ml-2">{action}</div>}
      </div>
    </header>
  );
}
