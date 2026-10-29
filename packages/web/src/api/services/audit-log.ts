import { db } from "../database";
import * as schema from "../database/schema";

/**
 * Supplier confidentiality report, requirement 9 — every view or edit of a
 * sensitive internal record (supplier identity, cost, contact, internal
 * notes) is written here. Append-only; nothing in the app updates or
 * deletes a row. Called from admin/suppliers.ts on every handler, both
 * reads ("view") and writes ("create"/"update"/"delete").
 */
export async function recordAuditLog(entry: {
  actorUserId: string;
  action: "view" | "create" | "update" | "delete";
  entityType: string;
  entityId?: number | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(schema.auditLogs).values({
    actorUserId: entry.actorUserId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
  });
}
