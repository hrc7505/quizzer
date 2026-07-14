import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

/**
 * Styles hook for the NavBar component.
 * Uses CSS media queries to handle mobile vs desktop layout.
 */
export const useNavBarStyles = makeStyles({
  nav: {
    backgroundColor: "#fff",
    borderBottom: "1px solid #e0e0e0",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    position: "sticky",
    top: "0",
    zIndex: "100",
  },

  /** Inner wrapper keeps the header items aligned with the centered page content. */
  navInner: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    ...shorthands.padding("8px", "16px"),
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: "56px",
  },

  /** Left section: hamburger + brand */
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  /** Hamburger: always visible on mobile, hidden on desktop for public routes */
  hamburger: {
    "@media (min-width: 768px)": {
      display: "none",
    },
  },

  brandLink: {
    textDecoration: "none",
    color: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  /** Desktop nav links: hidden on mobile, shown on md+ */
  desktopLinks: {
    display: "none",
    "@media (min-width: 768px)": {
      display: "flex",
      gap: "4px",
      alignItems: "center",
    },
  },

  navLinkAnchor: {
    textDecoration: "none",
  },

  /** Right section auth widget */
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  userChip: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  /** Hide name text on very small screens, only show avatar */
  userChipName: {
    display: "none",
    "@media (min-width: 480px)": {
      display: "block",
      color: "#475569",
    },
  },

  signOutBtn: {
    minWidth: "unset",
  },

  /** "Sign In" label hidden on mobile to save space */
  btnLabel: {
    display: "none",
    "@media (min-width: 480px)": {
      display: "inline",
    },
  },

  /** Admin drawer toggle button — hidden on mobile (hamburger is used instead) */
  adminDesktopToggle: {
    display: "none",
    "@media (min-width: 768px)": {
      display: "flex",
    },
  },

  // ── Mobile Public Drawer Styles ──

  mobileNavBody: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    paddingTop: "12px",
  },

  mobileNavLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textDecoration: "none",
    color: "#1e293b",
    fontWeight: "600",
    fontSize: "15px",
    padding: "12px 16px",
    borderRadius: "8px",
    ":hover": {
      backgroundColor: "#f1f5f9",
    },
  },

  mobileNavIcon: {
    display: "flex",
    alignItems: "center",
    color: "#6366f1",
  },

  mobileDivider: {
    height: "1px",
    backgroundColor: "#e2e8f0",
    marginTop: "8px",
    marginBottom: "8px",
  },

  mobileUserRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
  },

  mobileSignOutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "transparent",
    color: "#ef4444",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "#fee2e2",
    },
  },

  mobileSignInBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    padding: "12px 16px",
    borderRadius: "8px",
    backgroundColor: "#6366f1",
    color: "#fff",
    fontWeight: "700",
    fontSize: "15px",
    marginTop: "8px",
    ":hover": {
      backgroundColor: "#4f46e5",
    },
  },

  // ── Admin Drawer Styles ──

  adminDrawerHeader: {
    padding: "16px",
  },

  adminDrawerHeaderRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  adminDrawerFooter: {
    padding: "12px 16px",
    borderTop: "1px solid #e0e0e0",
  },
  brandImage: {
    height: "32px",
    width: "120px",
    objectFit: "contain",
  },
  iconSmall: {
    fontSize: "18px",
  },
});
