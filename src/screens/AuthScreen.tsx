import { FormEvent, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

const REMEMBERED_AUTH_KEY = "volunteer-calendar:remembered-auth";

interface RememberedAuth {
  email: string;
  password: string;
}

function readRememberedAuth(): RememberedAuth | null {
  try {
    const stored = window.localStorage.getItem(REMEMBERED_AUTH_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<RememberedAuth>;
    if (typeof parsed.email === "string" && typeof parsed.password === "string") {
      return { email: parsed.email, password: parsed.password };
    }
  } catch {
    window.localStorage.removeItem(REMEMBERED_AUTH_KEY);
  }

  return null;
}

function writeRememberedAuth(email: string, password: string) {
  window.localStorage.setItem(REMEMBERED_AUTH_KEY, JSON.stringify({ email, password }));
}

function clearRememberedAuth() {
  window.localStorage.removeItem(REMEMBERED_AUTH_KEY);
}

function getAuthErrorMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email or password is incorrect. Check the account and try again.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/email-already-in-use":
      return "That email already has an account. Try signing in instead.";
    case "auth/weak-password":
      return "Use a password with at least 6 characters.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled for this Firebase project.";
    case "auth/configuration-not-found":
      return "Firebase Authentication is not configured for this project. Enable Email/Password sign-in in Firebase Console and confirm this app uses the matching Firebase web config.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Could not complete authentication. Check the Firebase setup or try again.";
  }
}

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [rememberedAuth] = useState(readRememberedAuth);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(rememberedAuth?.email ?? "");
  const [password, setPassword] = useState(rememberedAuth?.password ?? "");
  const [displayName, setDisplayName] = useState("");
  const [rememberPassword, setRememberPassword] = useState(true);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      if (mode === "signup") {
        await signUp(email, password, displayName || email);
      } else {
        await signIn(email, password);
      }

      if (rememberPassword) {
        writeRememberedAuth(email, password);
      } else {
        clearRememberedAuth();
      }
    } catch (error) {
      console.error("Authentication failed", error);
      setError(getAuthErrorMessage(error));
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Internal access only</p>
        <h1>Volunteer Calendar</h1>
        <p className="muted">Sign in to coordinate schedules, class plans, and volunteer logs.</p>
        <form className="form-stack" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <label>
              Display name
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </label>
          ) : null}
          <label>
            Email
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label className="checkbox-label">
            <input
              checked={rememberPassword}
              onChange={(event) => setRememberPassword(event.target.checked)}
              type="checkbox"
            />
            Remember password on this device
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" type="submit">
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
        <button
          className="text-button"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          type="button"
        >
          {mode === "signup" ? "Use existing account" : "Create a student account"}
        </button>
      </section>
    </main>
  );
}

