import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    avatar_url?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    role_id: number; // 1 = Admin, 2 = Dentist
    [key: string]: unknown; // This allows for additional properties...
}

export interface Specialization {
    id: number;
    name: string;
}

export interface TreatmentType {
    id: number;
    name: string;
    description: string;
    standard_cost: string;
    duration_minutes: number;
    is_active: number; // boolean in DB, but might be number if not cast
    created_at?: string;
    updated_at?: string;
}

export interface Dentist {
    dentist_id: number;
    fname: string;
    mname: string | null;
    lname: string;
    specialization: string;
    contact_number: string | null;
    email: string;
    employment_status: string | null;
    hire_date: string | null;
    avatar_url: string | null;
}

export interface DentistFormData {
    fname: string;
    mname: string;
    lname: string;
    gender: string;
    contact_number: string;
    email: string;
    avatar: File | null;
    specialization_ids: number[];
    employment_status: string;
    hire_date: string;
}

export interface DentistsTableProps {
    dentists: Dentist[];
}

export interface RegisterDentistProps {
    specializations: Specialization[];
    errors?: Record<string, string>;
}

export interface DentistProfileProps {
    dentist: {
        id: number;
        fname: string;
        mname: string | null;
        lname: string;
        name: string;
        gender: string;
        email: string;
        contact_number: string | null;
        avatar_path: string | null;
        avatar_url: string | null;
        email_verified_at: string | null;
        role: {
            id: number;
            name: string;
        } | null;
        specializations: Specialization[];
        employment_status: string | null;
        hire_date: string | null;
        hire_date_formatted: string | null;
        archived_at?: string | null;
        created_at?: string;
        created_at_formatted?: string;
        must_change_password?: boolean;
    };
    viewMode: 'self' | 'admin';
}

export interface ChangePasswordProps {
    mustChangePassword: boolean;
}

export interface AdminAuditLog {
    id: number;
    admin_name: string;
    admin_email: string;
    activityTitle: string;
    moduleType: string;
    message: string;
    targetType: string | null;
    targetId: string | null;
    oldValue: Record<string, unknown> | null;
    newValue: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
    created_at: string;
}

export interface AdminAuditLogsProps {
    auditLogs: AdminAuditLog[];
}

export interface AddPatientProps {
    errors?: Record<string, string>;
}

export interface AddSpecializationProps {
    errors?: Record<string, string>;
}

export interface AddTreatmentTypeProps {
    errors?: Record<string, string>;
}
