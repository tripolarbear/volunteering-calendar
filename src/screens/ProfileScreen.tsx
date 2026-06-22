import { FormEvent, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { upgradeCurrentUserToTeacher } from "../auth/authService";

export function ProfileScreen() {
  const { profile, refreshProfile, user } = useAuth();
  const [passcode, setPasscode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleUpgrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!user) {
      setError("Sign in before changing tiers.");
      return;
    }

    const upgraded = await upgradeCurrentUserToTeacher(user.uid, passcode);
    if (!upgraded) {
      setError("Teacher passcode did not match.");
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
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            type="password"
          />
        </label>
        {message ? <p className="form-success">{message}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" type="submit">
          Upgrade to teacher
        </button>
      </form>
    </section>
  );
}
