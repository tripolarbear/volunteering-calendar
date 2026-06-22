import { useState, type ReactNode } from "react";
import { useAuth } from "./auth/AuthProvider";
import { AppShell, type ScreenKey } from "./components/AppShell";
import { AuthScreen } from "./screens/AuthScreen";
import { ProfileScreen } from "./screens/ProfileScreen";

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="muted">This workspace is ready for volunteer coordination.</p>
    </section>
  );
}

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
    dashboard: <PlaceholderScreen title="Dashboard" />,
    calendar: <PlaceholderScreen title="Calendar" />,
    board: <PlaceholderScreen title="Board" />,
    logs: <PlaceholderScreen title="Activity Logs" />,
    profile: <ProfileScreen />,
  };

  return (
    <AppShell activeScreen={activeScreen} onScreenChange={setActiveScreen}>
      {screens[activeScreen]}
    </AppShell>
  );
}
