import type { SupabaseClient } from '@supabase/supabase-js';
import { reportError } from '@/src/shared/lib/errorTracking';

export type AdminAuditAction = 'CREAR' | 'ELIMINAR';

export interface AdminAuditInput {
    action: AdminAuditAction;
    table: 'productos' | 'categorias';
    recordId: string;
    description: string;
}

export async function logAdminAudit(
    supabase: SupabaseClient,
    input: AdminAuditInput,
): Promise<void> {
    try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user?.id) return;

        const { error } = await supabase
            .from('auditoria')
            .insert({
                accion: input.action,
                tabla: input.table,
                registro_id: input.recordId,
                descripcion: input.description,
                usuario_id: authData.user.id,
                usuario_email: authData.user.email ?? null,
            });

        if (error) {
            void reportError({
                error: error.message,
                severity: 'warning',
                source: 'client',
                route: '/admin',
                action: 'audit_log_insert',
                context: {
                    table: input.table,
                    recordId: input.recordId,
                    actionType: input.action,
                },
            });
        }
    } catch (err) {
        void reportError({
            error: err,
            severity: 'warning',
            source: 'client',
            route: '/admin',
            action: 'audit_log_insert_crash',
            context: {
                table: input.table,
                recordId: input.recordId,
                actionType: input.action,
            },
        });
    }
}
