import { Pill } from "@/components/ui/misc";
import { statusLabel, statusTone } from "@/domain/orders";
import type { FulfilmentMethod, OrderStatus } from "@/services/types";

export function StatusPill({ status, method }: { status: OrderStatus; method: FulfilmentMethod }) {
  return (
    <Pill tone={statusTone(status)} dot>
      {statusLabel(status, method)}
    </Pill>
  );
}
