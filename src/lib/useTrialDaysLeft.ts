import { useEffect, useState } from "react";

/**
 * Days left in the 14-day trial. Reads Date.now() inside an effect (not during
 * render) so this stays a pure component per React's render rules, and matches
 * client/server output on first paint.
 */
export function useTrialDaysLeft(trialStartedAt: string) {
  const [daysLeft, setDaysLeft] = useState(14);

  useEffect(() => {
    // Date.now() is inherently impure — reading it has to happen in an effect,
    // not during render, so this is the one legitimate place for it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDaysLeft(Math.max(0, 14 - Math.floor((Date.now() - new Date(trialStartedAt).getTime()) / 86400000)));
  }, [trialStartedAt]);

  return daysLeft;
}
