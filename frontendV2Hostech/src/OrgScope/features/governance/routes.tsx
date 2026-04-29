import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { OwnerOrgGovernanceRoute } from '@/shared/components/routing/OwnerOrgGovernanceRoute';

const CompliancePlaceholderPage = lazy(() => import('./pages/CompliancePlaceholderPage'));
const OrganizationSettingsPlaceholderPage = lazy(() => import('./pages/OrganizationSettingsPlaceholderPage'));

export const governanceRoutes: RouteObject[] = [
  {
    path: 'compliance',
    element: (
      <OwnerOrgGovernanceRoute>
        <CompliancePlaceholderPage />
      </OwnerOrgGovernanceRoute>
    ),
  },
  {
    path: 'organization-settings',
    element: (
      <OwnerOrgGovernanceRoute>
        <OrganizationSettingsPlaceholderPage />
      </OwnerOrgGovernanceRoute>
    ),
  },
];
