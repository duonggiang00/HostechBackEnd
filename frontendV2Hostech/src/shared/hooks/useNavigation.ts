import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import type { User } from '@/shared/features/auth/types';
import { 
  ORG_NAVIGATION, 
  PROPERTY_NAVIGATION, 
  TENANT_NAVIGATION,
  type NavigationSection 
} from '@/shared/configs/navigation.config';
import { useQueryClient } from '@tanstack/react-query';
import { useTickets } from '@/PropertyScope/features/tickets/hooks/useTickets';
import { useContracts, usePendingRequests } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { usePropertyInvoices } from '@/PropertyScope/features/billing/hooks/usePropertyInvoices';
import type { PropertyDashboardData } from '@/PropertyScope/features/dashboard/types';

import { usePendingPayments } from '@/shared/features/billing/hooks/usePaymentVerification';

function matchesNavRoles(user: User | null | undefined, roles?: string[]): boolean {
  if (!roles?.length) return true;
  const userRoles =
    user?.roles && user.roles.length > 0
      ? user.roles
      : user?.role
        ? [user.role]
        : [];
  return roles.some((r) => userRoles.includes(r));
}

export function useNavigation() {
  const { user } = useAuthStore();
  const hasRole = useAuthStore((s) => s.hasRole);
  const { propertyId } = useParams<{ propertyId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();

  // 1. Xác định Scope hiện tại dựa trên URL
  const isOrgScope = location.pathname.startsWith('/org');
  const isPropertyScope = location.pathname.startsWith('/properties');
  const isTenantScope = location.pathname.startsWith('/app') || location.pathname.startsWith('/payment');

  // 2. Lấy Badge Data cho Property Scope
  const dashboardCache = queryClient.getQueryData<PropertyDashboardData>(['property-dashboard', propertyId]);
  const dashboardStats = dashboardCache?.stats;

  // Memoize Params
  const ticketParams = useMemo(() => ({ property_id: propertyId, status: 'OPEN' as const, per_page: 1 }), [propertyId]);
  const contractParams = useMemo(() => ({ property_id: propertyId, per_page: 1 }), [propertyId]);
  const invoiceParams = useMemo(() => ({ status: 'ISSUED' as const, per_page: 1 }), []);
  const pendingPaymentParams = useMemo(() => ({ property_id: propertyId, per_page: 1 }), [propertyId]);
  const isRequestsPage = location.pathname.includes('/requests');

  // Badge: Tickets
  const { data: openTicketsData } = useTickets(ticketParams, { 
    enabled: isPropertyScope && !!propertyId && !dashboardStats && !location.pathname.includes('/tickets'),
    staleTime: 10 * 60 * 1000,
  });

  // Badge: Contracts
  const { data: contractData } = useContracts(contractParams, { 
    enabled: isPropertyScope && !!propertyId && !dashboardStats && !location.pathname.includes('/contracts'),
    staleTime: 10 * 60 * 1000,
  });

  // Badge: Invoices
  const { data: invoiceIssuedData } = usePropertyInvoices(propertyId ?? '', invoiceParams, {
    enabled: isPropertyScope && !!propertyId && !dashboardStats && !location.pathname.includes('/invoices'),
    staleTime: 10 * 60 * 1000,
  });

  // Badge: Pending Payments
  const { data: pendingPaymentsData } = usePendingPayments(pendingPaymentParams, {
    enabled: isPropertyScope && !!propertyId && !dashboardStats && !location.pathname.includes('/payment-verifications'),
    staleTime: 10 * 60 * 1000,
  });

  // Badge: Pending Requests (ROOM_TRANSFER / ADD_MEMBER / TERMINATION)
  const pendingRequestsPropertyId =
    isPropertyScope && !!propertyId && !dashboardStats && !isRequestsPage ? propertyId : undefined;
  const { data: pendingRequestsData } = usePendingRequests(pendingRequestsPropertyId);

  const badges: Record<string, number> = {
    openTickets: dashboardStats?.pendingTickets ?? openTicketsData?.meta.total ?? 0,
    contractAttention: dashboardStats ? 0 : ((contractData?.status_counts?.PENDING_SIGNATURE ?? 0) + (contractData?.status_counts?.PENDING_PAYMENT ?? 0)),
    issuedInvoices: dashboardStats?.unpaidInvoices ?? invoiceIssuedData?.meta?.total ?? 0,
    pendingVerifications: pendingPaymentsData?.meta?.total ?? 0,
    pendingRequests: pendingRequestsData?.meta?.total ?? 0,
  };

  // 3. Hàm xử lý biến đổi Navigation Items (Role filtering & ID injection & Badges)
  const transformNavigation = (sections: NavigationSection[]): NavigationSection[] => {
    return sections
      .filter((section) => matchesNavRoles(user, section.roles))
      .map((section) => ({
        ...section,
        path: section.path?.replace(':propertyId', propertyId ?? ''),
        items: section.items
          .filter((item) => matchesNavRoles(user, item.roles))
          .map((item) => ({
            ...item,
            path: item.path.replace(':propertyId', propertyId ?? ''),
            badge: item.badgeKey ? (badges[item.badgeKey] > 0 ? badges[item.badgeKey] : undefined) : undefined,
            children: item.children?.map((child) => ({
              ...child,
              path: child.path.replace(':propertyId', propertyId ?? ''),
            })),
          })),
      }))
      .filter((section) => section.items.length > 0);
  };

  // 4. Trả về Navigation tương ứng với Scope
  let menuSections: NavigationSection[] = [];
  let scopeLabel = '';

  if (isOrgScope) {
    menuSections = transformNavigation(ORG_NAVIGATION);
    scopeLabel = 'Phạm vi tổ chức';
  } else if (isPropertyScope) {
    let propertySections = transformNavigation(PROPERTY_NAVIGATION);
    if (hasRole(['Staff'])) {
      const staffSectionOrder = [
        'staff_today',
        'service_metering',
        'people_support',
        'property_core',
        'finance_ledger',
      ];
      const byId = new Map(propertySections.map((s) => [s.id, s]));
      const ordered = staffSectionOrder
        .map((id) => byId.get(id))
        .filter(Boolean) as NavigationSection[];
      const tail = propertySections.filter((s) => !staffSectionOrder.includes(s.id));
      propertySections = [...ordered, ...tail];
    }
    menuSections = propertySections;
    scopeLabel = 'Phạm vi tòa nhà';
  } else if (isTenantScope) {
    menuSections = transformNavigation(TENANT_NAVIGATION);
    scopeLabel = 'Cổng cư dân';
  }

  return {
    menuSections,
    scopeLabel,
    isOrgScope,
    isPropertyScope,
    isTenantScope,
    propertyId
  };
}
