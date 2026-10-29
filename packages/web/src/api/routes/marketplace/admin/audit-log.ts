import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { requirePermission } from "../../../middleware/auth";
import { db } from "../../../database";
import * as schema from "../../../database/schema";

/**
 * Read-only view of `audit_logs` (supplier confidentiality report,
 * requirement 9) — gated behind `manage_admins` since the log itself
 * reveals who looked at what, which is admin-oversight data, not something
 * every supplier-permitted user should be able to browse.
 */
export const auditLog = {
  list: requirePermission("manage_admins")
    .input(
      z.object({
        entityType: z.string().optional(),
        limit: z.number().int().min(1).max(200).default(100),
      }),
    )
    .handler(({ input }) =>
      db
        .select()
        .from(schema.auditLogs)
        .where(input.entityType ? eq(schema.auditLogs.entityType, input.entityType) : undefined)
        .orderBy(desc(schema.auditLogs.id))
        .limit(input.limit),
    ),
};
