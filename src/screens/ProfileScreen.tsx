import { FormEvent, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { upgradeCurrentUserToTeacher } from "../auth/authService";

export function ProfileScreen() {
  const { profile, refreshProfile, user } = useAuth();
  const [passcode, setPasscode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const isTeacher = profile?.tier === "teacher";

  async function handleUpgrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (isTeacher) {
      return;
    }

    if (!user) {
      setError("Sign in before changing tiers.");
      return;
    }

    const result = await upgradeCurrentUserToTeacher(user.uid, passcode);
    if (!result.ok) {
      setError(
        result.reason === "missing-config"
          ? "Teacher passcode is not configured. Create appConfig/teacherAccess in Firestore with passcode set to qwer1234."
          : "Teacher passcode did not match.",
      );
      return;
    }

    await refreshProfile();
    setMessage("Teacher tier enabled.");
    setPasscode("");
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>{profile?.displayName || profile?.email}</h2>
        </div>
        <span className="role-badge">{profile?.tier}</span>
      </div>
      <form className="form-stack compact-form" onSubmit={handleUpgrade}>
        <label>
          Teacher passcode
          <input
            disabled={isTeacher}
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            type="password"
          />
        </label>
        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" disabled={isTeacher} type="submit">
          Upgrade to teacher
        </button>
        {isTeacher ? <p className="muted">You are already a teacher. No passcode is needed.</p> : null}
      </form>
    </section>
  );
}
