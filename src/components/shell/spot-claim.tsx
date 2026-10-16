"use client";

import { useEffect, useRef } from "react";
import { useSavePlace } from "@/queries/inbox";
import { useSession } from "@/queries/session";
import { useSpot } from "@/stores/spot";

/**
 * Turns the spot someone picked on the landing page into a saved place once
 * they're signed in and set up, so checkout already knows where to deliver.
 * It becomes the default when it's on their own campus.
 */
export function SpotClaim() {
  const { user } = useSession();
  const spot = useSpot((s) => s.spot);
  const markSaved = useSpot((s) => s.markSaved);
  const save = useSavePlace();
  const busy = useRef(false);

  useEffect(() => {
    if (!user?.onboarded || !spot || spot.savedFor === user.id || busy.current) return;
    busy.current = true;
    save.mutate(
      {
        label: spot.label.slice(0, 30),
        campusId: spot.campusId,
        zoneId: spot.zoneId,
        addressLine: (spot.addressLine || spot.label).slice(0, 120),
        isDefault: spot.campusId === user.campusId,
      },
      {
        onSuccess: () => markSaved(user.id),
        onSettled: () => {
          busy.current = false;
        },
      },
    );
  }, [user, spot, save, markSaved]);

  return null;
}
