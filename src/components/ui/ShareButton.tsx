"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { Share2, Share, Loader2 } from "lucide-react";
import { WhatsAppIcon, FacebookIcon, TelegramIcon } from "@/design-system/icons/socialIcons";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/components/ui/Dropdown";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

type SharePlatform = "whatsapp" | "facebook" | "telegram";

export interface ShareButtonProps {
  shareText: string;
  defaultUrl: string;
  resolveUrl?: () => Promise<string | undefined>;
  /** Accessible label for the icon button. */
  label?: string;
  /** Custom trigger icon. Defaults to the share glyph. */
  icon?: ReactNode;
  buttonAppearance?: ButtonProps["variant"];
  buttonSize?: ButtonProps["size"];
  buttonStyle?: CSSProperties;
  buttonClassName?: string;
}

const shareUrlForPlatform = (platform: SharePlatform, encodedText: string, encodedUrl: string) => {
  switch (platform) {
    case "whatsapp":
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    default:
      return "";
  }
};

const isMobileNativeShareAvailable = () => {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    (navigator.maxTouchPoints > 0 ||
      /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ||
      window.matchMedia?.("(pointer: coarse)")?.matches)
  );
};

const PLATFORMS: { key: SharePlatform; label: string; Icon: typeof WhatsAppIcon; colorClass: string }[] = [
  { key: "whatsapp", label: "WhatsApp", Icon: WhatsAppIcon, colorClass: "bg-brand-whatsapp hover:shadow-[0_6px_16px_var(--brand-whatsapp-shadow)]" },
  { key: "facebook", label: "Facebook", Icon: FacebookIcon, colorClass: "bg-brand-facebook hover:shadow-[0_6px_16px_var(--brand-facebook-shadow)]" },
  { key: "telegram", label: "Telegram", Icon: TelegramIcon, colorClass: "bg-brand-telegram hover:shadow-[0_6px_16px_var(--brand-telegram-shadow)]" },
];

export function ShareButton({
  shareText,
  defaultUrl,
  resolveUrl,
  label = "Share",
  icon,
  buttonAppearance = "ghost",
  buttonSize = "icon",
  buttonStyle,
  buttonClassName,
}: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const resolveShareUrl = async () => {
    if (!resolveUrl) {
      return defaultUrl;
    }
    try {
      const url = await resolveUrl();
      return url || defaultUrl;
    } catch {
      return defaultUrl;
    }
  };

  const handleShare = async (platform: SharePlatform) => {
    setIsLoading(true);
    try {
      const shareUrl = await resolveShareUrl();
      const encodedUrl = encodeURIComponent(shareUrl);
      const encodedText = encodeURIComponent(shareText);
      const targetUrl = shareUrlForPlatform(platform, encodedText, encodedUrl);
      if (targetUrl) {
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNativeShare = async () => {
    setIsLoading(true);
    try {
      const shareUrl = await resolveShareUrl();
      await navigator.share({ title: shareText, text: shareText, url: shareUrl });
    } catch {
      // user cancelled or unsupported — ignored
    } finally {
      setIsLoading(false);
    }
  };

  const triggerIcon = isLoading ? (
    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
  ) : (
    icon ?? <Share2 className="h-4 w-4" />
  );
  const showNative = isMobileNativeShareAvailable();

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant={buttonAppearance}
          size={buttonSize}
          className={cn("h-9 w-9 rounded-lg border border-border/80 bg-surface", buttonClassName)}
          style={buttonStyle}
          aria-label={label}
          disabled={isLoading}
        >
          {triggerIcon}
        </Button>
      </DropdownTrigger>
      
      <DropdownContent align="right" className="w-240px p-4 flex flex-col gap-3.5">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-bold text-foreground select-none">
            Share this quiz
          </span>
        </div>

        {showNative && (
          <Button
            variant="secondary"
            onClick={handleNativeShare}
            className="w-full justify-start gap-2.5 h-9 px-2.5 font-semibold text-xs border border-border/60 hover:bg-surface-hover hover:border-border"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary shrink-0">
              <Share className="h-3.5 w-3.5" />
            </span>
            <span>Share via device…</span>
          </Button>
        )}

        {showNative && <div className="h-px bg-border/80 w-full" />}

        <div className="flex items-center justify-around gap-1.5 select-none">
          {PLATFORMS.map(({ key, label: platformLabel, Icon, colorClass }) => (
            <button
              key={key}
              type="button"
              className="flex flex-col items-center gap-1.5 border-0 bg-transparent cursor-pointer p-1 rounded-xl w-16 active:scale-95 transition-transform"
              onClick={() => handleShare(key)}
              aria-label={platformLabel}
            >
              <span className={cn(
                "inline-flex items-center justify-center w-11 h-11 rounded-full text-white transition-all duration-150 shadow-xs",
                colorClass
              )}>
                <Icon size={20} />
              </span>
              <span className="text-[10px] font-bold text-muted-foreground/90">{platformLabel}</span>
            </button>
          ))}
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
