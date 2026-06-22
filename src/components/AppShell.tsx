import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthProvider";
import { RoleBadge } from "./RoleBadge";

export type ScreenKey = "dashboard" | "calendar" | "board" | "logs" | "profile";

const navItems: Array<{ key: ScreenKey; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "calendar", label: "Calendar" },
  { key: "logs", label: "Hours" },
  { key: "board", label: "Board" },
  { key: "profile", label: "Profile" },
];

export function AppShell({
  activeScreen,
  children,
  onScreenChange,
}: {
  activeScreen: ScreenKey;
  children: ReactNode;
  onScreenChange(screen: ScreenKey): void;
}) {
  const { profile, signOut } = useAuth();

  function handleSignOut() {
    if (window.confirm("Sign out of Volunteer Calendar?")) {
      signOut();
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">Daycare volunteer desk</p>
          <h1>Volunteer Calendar</h1>
          {profile ? <RoleBadge tier={profile.tier} /> : null}
        </div>
        <nav aria-label="Primary" className="nav-list">
          {navItems.map((item) => (
            <button
              className={item.key === activeScreen ? "nav-item nav-item--active" : "nav-item"}
              key={item.key}
              onClick={() => onScreenChange(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-workflow" aria-label="Workflow">
          <span>Workflow</span>
          <strong>{profile?.tier === "teacher" ? "Review requests and monitor calendars." : "Request a shift, then log hours."}</strong>
        </div>
        <button className="text-button" onClick={handleSignOut} type="button">
          Sign out
        </button>
      </aside>
      <main className="workspace">{children}</main>
    </div>
  );
}

