import { useState, type ReactNode } from "react";
import { useAuth } from "./auth/AuthProvider";
import { AppShell, type ScreenKey } from "./components/AppShell";
import { AuthScreen } from "./screens/AuthScreen";
import { ActivityLogsScreen } from "./screens/ActivityLogsScreen";
import { BoardScreen } from "./screens/BoardScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { ProfileScreen } from "./screens/ProfileScreen";

export default function App() {
  const auth = useAuth();
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("dashboard");

  if (auth.loading) {
    return (
      <main className="app-loading">
        <h1>Volunteer Calendar</h1>
        <p>Loading your internal workspace.</p>
      </main>
    );
  }

  if (!auth.user || !auth.profile) {
    return <AuthScreen />;
  }

  const screens: Record<ScreenKey, ReactNode> = {
    dashboard: (
      <DashboardScreen onNavigate={setActiveScreen} tier={auth.profile.tier} userId={auth.profile.uid} />
    ),
    calendar: <CalendarScreen tier={auth.profile.tier} userId={auth.profile.uid} />,
    board: <BoardScreen tier={auth.profile.tier} userId={auth.profile.uid} />,
    logs: <ActivityLogsScreen tier={auth.profile.tier} userId={auth.profile.uid} />,
    profile: <ProfileScreen />,
  };

  return (
    <AppShell activeScreen={activeScreen} onScreenChange={setActiveScreen}>
      {screens[activeScreen]}
    </AppShell>
  );
}
