import { FormEvent, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
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
    } catch {
      setError("Could not complete authentication. Check your email and password.");
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

