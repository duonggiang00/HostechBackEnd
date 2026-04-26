import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import { 
  ORG_NAVIGATION, 
  PROPERTY_NAVIGATION, 
  TENANT_NAVIGATION,
  type NavigationSection 
} from '@/shared/configs/navigation.config';
import { useQueryClient } from '@tanstack/react-query';
import { useTickets } from '@/PropertyScope/features/tickets/hooks/useTickets';
import { useContracts } from '@/PropertyScope/features/contracts/hooks/useContracts';
import { usePropertyInvoices } from '@/PropertyScope/features/billing/hooks/usePropertyInvoices';
import type { PropertyDashboardData } from '@/PropertyScope/features/dashboard/types';

export function useNavigation() {
  const { user } = useAuthStore();
  const { propertyId } = useParams<{ propertyId: string }>();
  const location = useLocation();
  const queryClient = useQueryClient();

  // 1. Xác định Scope hiện tại dựa trên URL
  const isOrgScope = location.pathname.startsWith('/org');
  const isPropertyScope = location.pathname.startsWith('/properties');
  const isTenantScope = location.pathname.startsWith('/app') || location.pathname.startsWith('/payment');

  // 2. Lấy Badge Data cho Property Scope (Optimization: dùng cache từ dashboard nếu có)
  const dashboardCache = queryClient.getQueryData<PropertyDashboardData>(['property-dashboard', propertyId]);
  const dashboardStats = dashboardCache?.stats;

  // Memoize Params to prevent redundant fetches on re-renders
  const ticketParams = useMemo(() => ({ property_id: propertyId, status: 'OPEN' as const, per_page: 1 }), [propertyId]);
  const contractParams = useMemo(() => ({ property_id: propertyId, per_page: 1 }), [propertyId]);
  const invoiceParams = useMemo(() => ({ status: 'ISSUED' as const, per_page: 1 }), []);

  // Badge: Tickets
  const { data: openTicketsData } = useTickets(ticketParams, { 
    enabled: isPropertyScope && !!propertyId && !dashboardStats && !location.pathname.includes('/tickets'),
    staleTime: 10 * 60 * 1000, // 10 minutes for badges
    gcTime: 15 * 60 * 1000,
  });

  // Badge: Contracts
  const { data: contractData } = useContracts(contractParams, { 
    enabled: isPropertyScope && !!propertyId && !dashboardStats && !location.pathname.includes('/contracts'),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Badge: Invoices
  const { data: invoiceIssuedData } = usePropertyInvoices(propertyId ?? '', invoiceParams, {
    enabled: isPropertyScope && !!propertyId && !dashboardStats && !location.pathname.includes('/invoices'),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const badges: Record<string, number> = {
    openTickets: dashboardStats?.pendingTickets ?? openTicketsData?.meta.total ?? 0,
    contractAttention: dashboardStats ? 0 : ((contractData?.status_counts?.PENDING_SIGNATURE ?? 0) + (contractData?.status_counts?.PENDING_PAYMENT ?? 0)),
    issuedInvoices: dashboardStats?.unpaidInvoices ?? invoiceIssuedData?.meta?.total ?? 0,
  };

  // 3. Hàm xử lý biến đổi Navigation Items (Role filtering & ID injection & Badges)
  const transformNavigation = (sections: NavigationSection[]): NavigationSection[] => {
    return sections
      .map(section => ({
        ...section,
        path: section.path?.replace(':propertyId', propertyId ?? ''),
        items: section.items
          .filter(item => !item.roles || (user?.role && item.roles.includes(user.role)))
          .map(item => ({
            ...item,
            path: item.path.replace(':propertyId', propertyId ?? ''),
            badge: item.badgeKey ? (badges[item.badgeKey] > 0 ? badges[item.badgeKey] : undefined) : undefined,
            children: item.children?.map(child => ({
              ...child,
              path: child.path.replace(':propertyId', propertyId ?? ''),
            }))
          }))
      }))
      .filter(section => section.items.length > 0);
  };

  // 4. Trả về Navigation tương ứng với Scope
  let menuSections: NavigationSection[] = [];
  let scopeLabel = '';

  if (isOrgScope) {
    menuSections = transformNavigation(ORG_NAVIGATION);
    scopeLabel = 'Phạm vi tổ chức';
  } else if (isPropertyScope) {
    menuSections = transformNavigation(PROPERTY_NAVIGATION);
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
