import type { Tier } from "../types";

export function RoleBadge({ tier }: { tier: Tier }) {
  return <span className={`role-badge role-badge--${tier}`}>{tier}</span>;
}

