import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Settings, Building2, LayoutGrid, Coins } from 'lucide-react';
import { FeatureTabbedLayout } from '../../../components/FeatureTabbedLayout';

export function TemplatesPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  if (!propertyId) return null;

  const tabs = [
    { 
      id: 'info', 
      label: 'Thông tin tòa nhà', 
      icon: Building2,
    },
    { 
      id: 'services', 
      label: 'Dịch vụ & Bảng giá', 
      icon: Coins,
    },
    { 
      id: 'rooms', 
      label: 'Mẫu thiết lập phòng', 
      icon: LayoutGrid,
    }
  ];

  // Derive active tab from the last segment of the path
  const currentPath = location.pathname.split('/').pop() || 'info';
  const activeTab = tabs.some(tab => tab.id === currentPath) ? currentPath : 'info';

  const handleTabChange = (tabId: string) => {
    navigate(`/properties/${propertyId}/templates/${tabId}`);
  };

  return (
    <FeatureTabbedLayout
      tabs={tabs}
      title="Thiết lập tòa nhà"
      description="Quản lý các thông số vận hành và mẫu cấu hình tiêu chuẩn"
      icon={Settings}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      <Outlet />
    </FeatureTabbedLayout>
  );
}

