import { Menu, Card, Avatar, Typography } from "antd";
import { User, Lock, Shield } from "lucide-react";
import { useTokenStore } from "../../auth/stores/authStore";
import type { MenuProps } from "antd";

const { Title, Text } = Typography;

interface ProfileSidebarProps {
  activeTab: string;
  onTabChange: (key: string) => void;
  profile?: any;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  activeTab,
  onTabChange,
  profile,
}) => {
  const role = useTokenStore((state) => state.role);

  const menuItems: MenuProps["items"] = [
    {
      key: "personal",
      icon: <User size={18} />,
      label: "Thông tin cá nhân",
    },
    {
      key: "password",
      icon: <Lock size={18} />,
      label: "Đổi mật khẩu",
    },
    {
      key: "2fa",
      icon: <Shield size={18} />,
      label: "Bảo mật 2 lớp (2FA)",
    },
  ];

  return (
    <Card
      className="h-fit sticky top-6 shadow-sm rounded-2xl overflow-hidden"
      bordered={false}
    >
      {/* User Info Card */}
      <div className="flex flex-col items-center mb-6 pb-6 border-b border-gray-200">
        <Avatar
          src={profile?.avatar_url}
          size={64}
          icon={<User />}
          className="bg-blue-500"
        />
        <Title level={5} className="mt-3 mb-1">
          {profile?.full_name || "Người dùng"}
        </Title>
        <Text type="secondary" className="text-xs">
          {role}
        </Text>
      </div>

      {/* Navigation Menu */}
      <Menu
        items={menuItems}
        selectedKeys={[activeTab]}
        onClick={(e) => onTabChange(e.key)}
        className="border-0"
        mode="vertical"
      />
    </Card>
  );
};
