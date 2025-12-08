import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import AppLayout from '@/layouts/app-layout';
import admin from '@/routes/admin';
import { dashboard } from '@/routes';
import {
    type AdminAuditLog,
    type AdminAuditLogsProps,
    type BreadcrumbItem,
} from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Audit Logs',
        href: admin.audit.logs().url,
    },
];

export default function AdminAuditLogs({ auditLogs }: AdminAuditLogsProps) {
    const columns = [
        {
            accessorKey: 'id',
            header: 'ID',
            cell: ({ row }: { row: { original: AdminAuditLog } }) => (
                <span className="font-medium">{row.original.id}</span>
            ),
        },
        {
            accessorKey: 'admin_name',
            header: 'Admin',
            cell: ({ row }: { row: { original: AdminAuditLog } }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.admin_name}</span>
                    <span className="text-xs text-muted-foreground">
                        {row.original.admin_email}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'activityTitle',
            header: 'Activity',
            cell: ({ row }: { row: { original: AdminAuditLog } }) => (
                <Badge variant="outline">{row.original.activityTitle}</Badge>
            ),
        },
        {
            accessorKey: 'moduleType',
            header: 'Module',
            cell: ({ row }: { row: { original: AdminAuditLog } }) => (
                <Badge variant="secondary">{row.original.moduleType}</Badge>
            ),
        },
        {
            accessorKey: 'message',
            header: 'Message',
            cell: ({ row }: { row: { original: AdminAuditLog } }) => (
                <div className="max-w-md truncate" title={row.original.message}>
                    {row.original.message}
                </div>
            ),
        },
        {
            accessorKey: 'targetType',
            header: 'Target Type',
            cell: ({ row }: { row: { original: AdminAuditLog } }) =>
                row.original.targetType || (
                    <span className="text-muted-foreground">-</span>
                ),
        },
        {
            accessorKey: 'targetId',
            header: 'Target ID',
            cell: ({ row }: { row: { original: AdminAuditLog } }) =>
                row.original.targetId || (
                    <span className="text-muted-foreground">-</span>
                ),
        },
        {
            accessorKey: 'ipAddress',
            header: 'IP Address',
            cell: ({ row }: { row: { original: AdminAuditLog } }) =>
                row.original.ipAddress ? (
                    <span className="font-mono text-xs">
                        {row.original.ipAddress}
                    </span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                ),
        },
        {
            accessorKey: 'created_at',
            header: 'Date/Time',
            cell: ({ row }: { row: { original: AdminAuditLog } }) => (
                <span className="whitespace-nowrap text-xs">
                    {row.original.created_at}
                </span>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Audit Logs" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Admin Audit Logs
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            View and track all administrative activities
                        </p>
                    </div>
                </div>
                <div className="relative flex-1 overflow-hidden rounded-xl border border-brand-dark/20 bg-card shadow-[0_22px_48px_-30px_rgba(38,41,47,0.6)] transition-shadow dark:border-brand-light/20 dark:bg-card/60 dark:shadow-[0_18px_42px_-28px_rgba(8,9,12,0.78)]">
                    <div className="h-full overflow-auto p-4">
                        <DataTable
                            columns={columns}
                            data={auditLogs}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
