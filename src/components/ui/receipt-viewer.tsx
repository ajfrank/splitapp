"use client";

import { useState } from "react";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ReceiptViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ReceiptViewer({ src, alt = "Receipt", onClose }: ReceiptViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const rotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        onClick={onClose}
      >
        {/* Controls */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/10 hover:bg-white/20 text-white"
            onClick={(e) => {
              e.stopPropagation();
              zoomOut();
            }}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/10 hover:bg-white/20 text-white"
            onClick={(e) => {
              e.stopPropagation();
              zoomIn();
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/10 hover:bg-white/20 text-white"
            onClick={(e) => {
              e.stopPropagation();
              rotate();
            }}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-white/10 hover:bg-white/20 text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Image */}
        <motion.img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: "transform 0.2s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </motion.div>
    </AnimatePresence>
  );
}

interface ReceiptThumbnailProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ReceiptThumbnail({ src, alt = "Receipt", className }: ReceiptThumbnailProps) {
  const [showViewer, setShowViewer] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowViewer(true)}
        className={`relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 transition-colors ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
          <ZoomIn className="h-5 w-5 text-white opacity-0 hover:opacity-100 drop-shadow-lg" />
        </div>
      </button>

      {showViewer && (
        <ReceiptViewer
          src={src}
          alt={alt}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
}
