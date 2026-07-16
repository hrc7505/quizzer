"use client";

import { Text, makeStyles, shorthands } from "@fluentui/react-components";
import { Warning20Regular, BookOpen20Regular, Sparkle20Regular, Brain20Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    ...shorthands.padding("48px", "24px"),
    backgroundColor: "#f9fafb", // Premium soft background
    ...shorthands.borderRadius("16px"),
    ...shorthands.border("1px", "dashed", "#e5e7eb"),
    gap: "8px",
    width: "100%",
    boxSizing: "border-box",
  },
  rootCompact: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    ...shorthands.padding("24px", "16px"),
    backgroundColor: "transparent",
    border: "none",
    gap: "6px",
    width: "100%",
    boxSizing: "border-box",
  },
  iconContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)", // Indigo gradient
    color: "#6366f1",
    marginBottom: "12px",
    fontSize: "24px",
    boxShadow: "0 4px 10px rgba(99, 102, 241, 0.05)",
  },
  iconContainerCompact: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#f3f4f6",
    color: "#9ca3af",
    marginBottom: "4px",
    fontSize: "18px",
  },
  title: {
    color: "#1f2937",
    fontWeight: "600",
    fontSize: "16px",
    display: "block",
  },
  description: {
    color: "#4b5563",
    maxWidth: "380px",
    lineHeight: "1.5",
    fontSize: "13px",
    display: "block",
    marginTop: "2px",
  },
  action: {
    marginTop: "16px",
  },
});

const iconMap: Record<string, React.ReactNode> = {
  warning: <Warning20Regular />,
  book: <BookOpen20Regular />,
  sparkle: <Sparkle20Regular />,
  brain: <Brain20Regular />,
};

interface NoDataProps {
  title: string;
  description?: string;
  icon?: "warning" | "book" | "sparkle" | "brain" | React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}

export function NoData({ title, description, icon = "warning", action, compact = false }: NoDataProps) {
  const styles = useStyles();
  const resolvedIcon = icon && typeof icon === "string" ? iconMap[icon] : icon;

  return (
    <div className={compact ? styles.rootCompact : styles.root}>
      {resolvedIcon && (
        <div className={compact ? styles.iconContainerCompact : styles.iconContainer}>
          {resolvedIcon}
        </div>
      )}
      <Text className={styles.title}>{title}</Text>
      {description && <Text className={styles.description}>{description}</Text>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export default NoData;
