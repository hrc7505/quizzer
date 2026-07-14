"use client";

import { useState, type CSSProperties, type ReactElement, type ReactNode } from "react";
import {
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  Spinner,
  Text,
  makeStyles,
  mergeClasses,
  shorthands,
} from "@fluentui/react-components";
import { Share24Regular, ShareAndroid24Regular } from "@fluentui/react-icons";
import { WhatsAppIcon, FacebookIcon, TelegramIcon } from "./socialIcons";

type SharePlatform = "whatsapp" | "facebook" | "telegram";

export interface ShareButtonProps {
  shareText: string;
  defaultUrl: string;
  resolveUrl?: () => Promise<string | undefined>;
  /** Accessible label for the icon button. */
  label?: string;
  /** Custom trigger icon. Defaults to the share glyph. */
  icon?: ReactNode;
  buttonAppearance?: "primary" | "secondary" | "outline" | "subtle" | "transparent";
  buttonSize?: "small" | "medium" | "large";
  buttonStyle?: CSSProperties;
  buttonClassName?: string;
}

const useStyles = makeStyles({
  trigger: {
    ...shorthands.padding("0"),
  },

  popover: {
    ...shorthands.borderRadius("16px"),
    ...shorthands.padding("0"),
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.18)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },

  sheet: {
    width: "248px",
    ...shorthands.padding("16px"),
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
  },

  sheetHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sheetTitle: {
    color: "#0f172a",
    fontSize: "14px",
  },

  nativeRow: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    width: "100%",
    ...shorthands.border("none"),
    background: "transparent",
    cursor: "pointer",
    ...shorthands.padding("8px", "10px"),
    ...shorthands.borderRadius("12px"),
    fontWeight: "600",
    fontSize: "14px",
    color: "#0f172a",
    textAlign: "left",
    transitionProperty: "background-color, color",
    transitionDuration: "0.15s",
    ":hover": {
      backgroundColor: "rgba(79, 70, 229, 0.10)",
      color: "#4f46e5",
    },
  },

  nativeIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    ...shorthands.borderRadius("50%"),
    backgroundColor: "#eef2ff",
    color: "#4f46e5",
    ...shorthands.flex(0, 0, "auto"),
  },

  divider: {
    height: "1px",
    backgroundColor: "#e2e8f0",
    width: "100%",
  },

  iconRow: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "flex-start",
    ...shorthands.gap("8px"),
  },

  iconBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    ...shorthands.gap("6px"),
    ...shorthands.border("none"),
    background: "transparent",
    cursor: "pointer",
    ...shorthands.padding("4px"),
    ...shorthands.borderRadius("12px"),
    minWidth: "64px",
  },

  iconCircle: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "52px",
    height: "52px",
    ...shorthands.borderRadius("50%"),
    color: "#ffffff",
    transitionProperty: "transform, box-shadow",
    transitionDuration: "0.15s",
  },

  iconLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
  },

  whatsappCircle: {
    backgroundColor: "#25D366",
    ":hover": {
      boxShadow: "0 6px 16px rgba(37, 211, 102, 0.45)",
      transform: "translateY(-2px)",
    },
  },
  facebookCircle: {
    backgroundColor: "#1877F2",
    ":hover": {
      boxShadow: "0 6px 16px rgba(24, 119, 242, 0.45)",
      transform: "translateY(-2px)",
    },
  },
  telegramCircle: {
    backgroundColor: "#229ED9",
    ":hover": {
      boxShadow: "0 6px 16px rgba(34, 158, 217, 0.45)",
      transform: "translateY(-2px)",
    },
  },
});

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

const PLATFORMS: { key: SharePlatform; label: string; Icon: typeof WhatsAppIcon; circleClass: string }[] = [
  { key: "whatsapp", label: "WhatsApp", Icon: WhatsAppIcon, circleClass: "whatsappCircle" },
  { key: "facebook", label: "Facebook", Icon: FacebookIcon, circleClass: "facebookCircle" },
  { key: "telegram", label: "Telegram", Icon: TelegramIcon, circleClass: "telegramCircle" },
];

export function ShareButton({
  shareText,
  defaultUrl,
  resolveUrl,
  label = "Share",
  icon,
  buttonAppearance = "subtle",
  buttonSize = "medium",
  buttonStyle,
  buttonClassName,
}: ShareButtonProps) {
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

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
      setOpen(false);
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
      setOpen(false);
    }
  };

  const triggerIcon = isLoading ? <Spinner size="tiny" /> : (icon ?? <Share24Regular />);
  const showNative = isMobileNativeShareAvailable();

  return (
    <Menu open={open} onOpenChange={(_, data) => setOpen(data.open)} positioning="below-end">
      <MenuTrigger disableButtonEnhancement>
        <Button
          appearance={buttonAppearance}
          size={buttonSize}
          className={mergeClasses(styles.trigger, buttonClassName)}
          style={buttonStyle}
          aria-label={label}
          icon={triggerIcon as ReactElement}
        />
      </MenuTrigger>
      <MenuPopover className={styles.popover}>
        <div className={styles.sheet}>
          <div className={styles.sheetHeader}>
            <Text weight="semibold" className={styles.sheetTitle}>
              Share this quiz
            </Text>
          </div>

          {showNative && (
            <button
              type="button"
              className={styles.nativeRow}
              onClick={handleNativeShare}
              aria-label="Share via device"
            >
              <span className={styles.nativeIcon}>
                <ShareAndroid24Regular />
              </span>
              Share via device…
            </button>
          )}

          {showNative && <div className={styles.divider} />}

          <div className={styles.iconRow}>
            {PLATFORMS.map(({ key, label: platformLabel, Icon, circleClass }) => (
              <button
                key={key}
                type="button"
                className={styles.iconBtn}
                onClick={() => handleShare(key)}
                aria-label={platformLabel}
              >
                <span className={mergeClasses(styles.iconCircle, styles[circleClass as keyof typeof styles])}>
                  <Icon size={26} />
                </span>
                <span className={styles.iconLabel}>{platformLabel}</span>
              </button>
            ))}
          </div>
        </div>
      </MenuPopover>
    </Menu>
  );
}
