"use client";

import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { ImageIcon, AlertCircle } from "lucide-react";

import { cn } from "@/utils/cn";
import { sanitizeImageUrl } from "@/lib/format";

import type { ShimmerImageProps } from "@/components/ui/interfaces/ShimmerImage.interface";

/**
 * Validates and sanitizes image source URL to satisfy strict DOM XSS guards.
 */
function getValidatedSrc(url?: string | null): string | null {
  const sanitized = sanitizeImageUrl(url);
  if (!sanitized) return null;

  // Safe data:image base64
  if (sanitized.startsWith("data:image/")) {
    return sanitized;
  }

  // Safe relative paths
  if (sanitized.startsWith("/") && !sanitized.startsWith("//") && !sanitized.includes("\\")) {
    return encodeURI(sanitized);
  }

  // Safe absolute HTTP/HTTPS URLs
  try {
    const parsed = new URL(sanitized);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return encodeURI(parsed.href);
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * High-performance image component that renders a shimmering placeholder
 * until the image has fully loaded, with smooth opacity cross-fade, dark mode inversion,
 * and graceful error handling.
 */
export const ShimmerImage = React.memo(function ShimmerImage({
  src,
  alt = "Diagram image",
  invertInDark = true,
  containerClassName,
  className,
  onClick,
  fallbackText = "Unable to load diagram",
  ...props
}: ShimmerImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const safeSrc = useMemo(() => getValidatedSrc(src), [src]);

  // Check if image is already cached/complete on initial mount
  useEffect(() => {
    if (imgRef.current?.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setIsLoading(false);
      }
    }
  }, [safeSrc]);

  if (!safeSrc || hasError) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-border bg-secondary/30 text-muted-foreground text-xs",
          containerClassName
        )}
      >
        <AlertCircle className="h-5 w-5 text-muted-foreground/60" />
        <span>{fallbackText}</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl bg-secondary/30",
        onClick && "cursor-zoom-in",
        containerClassName
      )}
    >
      {/* Shimmer Placeholder Skeleton */}
      {isLoading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-secondary/60 animate-pulse"
          aria-hidden="true"
        >
          {/* Animated Shimmer Wave */}
          <div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/15 dark:via-white/5 to-transparent animate-[shimmer_1.8s_infinite]"
            style={{ backgroundSize: "200% 100%" }}
          />
          <ImageIcon className="h-6 w-6 text-muted-foreground/40 animate-pulse" />
        </div>
      )}

      {/* Main Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={safeSrc}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={cn(
          "w-auto max-w-full object-contain transition-opacity duration-300 ease-out",
          isLoading ? "opacity-0" : "opacity-100",
          invertInDark && "dark:invert",
          className
        )}
        {...props}
      />
    </div>
  );
});
