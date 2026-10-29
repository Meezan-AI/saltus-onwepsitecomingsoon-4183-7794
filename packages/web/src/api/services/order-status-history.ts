import { db } from "../database";
import * as schema from "../database/schema";

/**
 * Writes one row to `order_status_history` for every `orders.status`
 * transition. Call this alongside (never instead of) the `orders.status`
 * update itself — it does not update the order, only logs the change.
 *
 * `fromStatus: null` marks the entry logged right after an order is created
 * (report item 8's audit trail starts at creation, not just at the first
 * transition). `changedBy: null` marks a change the system made on its own
 * (e.g. auto-advancing to "design_approved" once every item is resolved).
 */
export async function recordOrderStatusChange(params: {
  orderId: number;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string | null;
  note?: string;
}) {
  await db.insert(schema.orderStatusHistory).values({
    orderId: params.orderId,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
    changedBy: params.changedBy,
    note: params.note,
  });
}
