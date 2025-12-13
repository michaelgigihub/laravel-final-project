import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    ChevronRight,
    ClipboardList,
    Clock,
    FileText,
    LayoutGrid,
    Settings,
    Stethoscope,
    Syringe,
    Tag,
    User,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

// Role constants
const ROLE_ADMIN = 1;
const ROLE_DENTIST = 2;

interface ServiceSubItem {
    title: string;
    href: string;
    icon: typeof Tag;
}

const servicesSubItems: ServiceSubItem[] = [
    {
        title: 'Specializations',
        href: '/admin/specializations',
        icon: Tag,
    },
    {
        title: 'Treatment Types',
        href: '/admin/treatment-types',
        icon: Syringe,
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const page = usePage<SharedData>();
    const user = auth.user;

    const userRole = (auth.user as { role_id?: number }).role_id;
    const isAdmin = userRole === ROLE_ADMIN;
    const isDentist = userRole === ROLE_DENTIST;

    // Build navigation items based on role
    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: isDentist ? '/dentist/dashboard' : dashboard(),
            icon: LayoutGrid,
        },
    ];

    // Shared items (both admin and dentist)
    mainNavItems.push({
        title: 'Patients',
        href: '/patients',
        icon: Users,
    });
    mainNavItems.push({
        title: 'Appointments',
        href: '/appointments',
        icon: Calendar,
    });
    mainNavItems.push({
        title: 'Treatment Records',
        href: '/treatment-records',
        icon: ClipboardList,
    });

    // Admin-only items
    if (isAdmin) {
        mainNavItems.push({
            title: 'Dentists',
            href: admin.dentists.index(),
            icon: Stethoscope,
        });
        mainNavItems.push({
            title: 'Clinic Hours',
            href: '/admin/clinic-availability',
            icon: Clock,
        });
        mainNavItems.push({
            title: 'Reports',
            href: '/admin/reports',
            icon: FileText,
        });
        mainNavItems.push({
            title: 'Audit Logs',
            href: admin.audit.logs(),
            icon: FileText,
        });
    }

    const isServicesActive = servicesSubItems.some((item) =>
        page.url.startsWith(item.href),
    );

    // Determine the correct dashboard URL based on role
    const dashboardUrl = isDentist ? '/dentist/dashboard' : dashboard();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {user.role_id === 1 && <NavMain items={mainNavItems} />}

                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarMenu>
                        {mainNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={page.url.startsWith(
                                        typeof item.href === 'string'
                                            ? item.href
                                            : item.href.url,
                                    )}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* Admin-only Management Section */}
                {isAdmin && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Management</SidebarGroupLabel>
                        <SidebarMenu>
                            <Collapsible
                                asChild
                                defaultOpen={isServicesActive}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={{ children: 'Services' }}
                                            isActive={isServicesActive}
                                        >
                                            <Settings />
                                            <span>Services</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {servicesSubItems.map((item) => (
                                                <SidebarMenuSubItem
                                                    key={item.title}
                                                >
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={page.url.startsWith(
                                                            item.href,
                                                        )}
                                                    >
                                                        <Link
                                                            href={item.href}
                                                            prefetch
                                                        >
                                                            <item.icon />
                                                            <span>
                                                                {item.title}
                                                            </span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                            {user.role_id === 1 && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={page.url.startsWith(
                                            '/admin/users',
                                        )}
                                    >
                                        <Link href="/admin/users" prefetch>
                                            <Users />
                                            <span>Admin Users</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                {isDentist && (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={page.url.startsWith(
                                    '/dentist/profile',
                                )}
                                tooltip={{ children: 'My Profile' }}
                            >
                                <Link href="/dentist/profile" prefetch>
                                    <User />
                                    <span>My Profile</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
