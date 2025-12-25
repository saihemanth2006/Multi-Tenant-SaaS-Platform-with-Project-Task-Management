import { PoolClient } from 'pg';

type AuditEntry = {
	tenantId: string;
	userId?: string | null;
	action: string;
	entityType: string;
	entityId?: string | null;
	ipAddress?: string | null;
};

// Records an audit log. Best-effort: failures should not block main flow in dev.
export async function recordAudit(client: PoolClient, entry: AuditEntry): Promise<void> {
	try {
		await client.query(
			`INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			[
				entry.tenantId,
				entry.userId || null,
				entry.action,
				entry.entityType,
				entry.entityId || null,
				entry.ipAddress || null
			]
		);
	} catch {
		// Swallow errors in dev so missing table/connection doesn't crash
		return;
	}
}
