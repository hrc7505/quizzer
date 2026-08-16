"use client";

import * as React from "react";
import { Image as ImageIcon, Upload, X, Loader2, Link2, RotateCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cn } from "@/utils/cn";
import { sanitizeImageUrl } from "@/lib/format";
import type { ImageUploaderProps } from "@/components/forms/interfaces/ImageUploader.interface";

/**
 * Reusable Image Uploader component supporting file uploads to Cloudinary CDN,
 * real-time upload progress tracking, external URL pasting, drag & drop, 
 * 1-click retry on failure, and dark-mode schematic inversion toggle.
 */
export function ImageUploader({
  value,
  onChange,
  invertInDark = true,
  onInvertInDarkChange,
  showInvertToggle = true,
  label = "Circuit / Question Diagram (Optional)",
  invertHelperText = "Converts white-background schematics to dark mode. Uncheck if the image is a color photo or already dark.",
  maxSizeMB = 10,
  className,
  disabled = false,
}: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const safeImageUrl = React.useMemo(() => sanitizeImageUrl(value), [value]);

  const {
    isUploading,
    progress,
    error,
    uploadFile,
    retryUpload,
  } = useImageUpload((url) => {
    onChange(url);
  });

  const handleFileSelection = (file: File | undefined) => {
    if (!file || disabled || isUploading) return;
    uploadFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelection(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled || isUploading) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    // Check if any clipboard item is an image file (screenshot, clipart, copied file)
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          e.stopPropagation();

          const ext = item.type.split("/")[1] || "png";
          const namedFile = new File([file], `clipboard-diagram-${Date.now()}.${ext}`, {
            type: item.type,
          });

          handleFileSelection(namedFile);
          return;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    handleFileSelection(file);
  };

  const shouldInvert = invertInDark !== false;

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 p-3.5 rounded-xl border border-border/70 bg-secondary/10 transition-colors focus-within:border-primary/50",
        isDragOver && "border-primary bg-primary/5 ring-2 ring-primary/20",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {/* Header Label & Remove Action */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-primary" />
          <span>{label}</span>
        </label>
        {value && !isUploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled}
            className="text-[11px] font-semibold text-danger hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <X className="h-3 w-3" />
            Remove image
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handleInputChange}
      />

      {/* Image Preview State */}
      {safeImageUrl && !isUploading ? (
        <div className="flex flex-col gap-3 p-3 bg-card border border-border/80 rounded-xl">
          <div className="max-h-52 max-w-full overflow-hidden rounded-lg bg-card/60 dark:bg-zinc-950/80 p-3 border border-border/40 flex items-center justify-center">
            <img
              src={safeImageUrl}
              alt="Diagram preview"
              className={cn(
                "max-h-48 max-w-full object-contain transition-all",
                shouldInvert && "dark:invert"
              )}
            />
          </div>

          <div className="w-full flex items-center justify-between text-[11px] text-muted-foreground px-1 truncate">
            <span className="truncate max-w-[260px] font-mono text-[10px] text-muted-foreground/80">
              {value}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </Button>
          </div>

          {/* Dark Mode Invert Toggle */}
          {showInvertToggle && onInvertInDarkChange && (
            <div className="pt-2 border-t border-border/50">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={invertInDark}
                  disabled={disabled}
                  onChange={(e) => onInvertInDarkChange(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5 cursor-pointer accent-primary"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    Auto-invert diagram in Dark Mode
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {invertHelperText}
                  </span>
                </div>
              </label>
            </div>
          )}
        </div>
      ) : (
        /* Upload / Input Zone */
        <div className="flex flex-col gap-2">
          {/* Active Upload Progress Bar */}
          {isUploading ? (
            <div className="flex flex-col gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5 animate-fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <div className="flex items-center gap-1.5 text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading image to Cloudinary...</span>
                </div>
                <span className="font-mono text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-secondary" indicatorClassName="bg-primary transition-all duration-150" />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="relative flex-1 w-full">
                <Input
                  value={value || ""}
                  onChange={(e) => onChange(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Paste copied image (⌘V) / image URL, or click upload"
                  className="text-xs pl-8"
                  disabled={disabled}
                />
                <Link2 className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <span className="text-[11px] text-muted-foreground font-semibold uppercase">or</span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto h-9 text-xs font-semibold gap-1.5 shrink-0"
              >
                <Upload className="h-3.5 w-3.5 text-primary" />
                <span>Upload File</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error Notification Bar with 1-Click Retry */}
      {error && !isUploading && (
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-danger/10 border border-danger/25 text-danger mt-1 animate-fade-in">
          <p className="text-[11px] font-medium leading-tight flex-1 break-words">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={retryUpload}
            className="h-7 px-2.5 text-[11px] font-bold text-danger border-danger/30 hover:bg-danger/15 shrink-0 gap-1.5"
            aria-label="Retry upload"
          >
            <RotateCw className="h-3 w-3" />
            <span>Retry</span>
          </Button>
        </div>
      )}
    </div>
  );
}
