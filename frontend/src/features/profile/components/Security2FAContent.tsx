import React from "react";
import { Card, Typography } from "antd";
import { Setup2FA } from "./Setup2FA";

const { Title, Text } = Typography;

interface Security2FAContentProps {
  is2FAEnabled: boolean;
}

export const Security2FAContent: React.FC<Security2FAContentProps> = ({
  is2FAEnabled,
}) => {
  return (
    <div>
      <div className="mb-6">
        <Title level={3} className="m-0">
          Bảo mật 2 lớp (2FA)
        </Title>
        <Text type="secondary">
          Thêm lớp bảo mật bổ sung cho tài khoản của bạn
        </Text>
      </div>

      <Card className="shadow-sm rounded-2xl overflow-hidden" bordered={false}>
        <Setup2FA is2FAEnabled={is2FAEnabled} />
      </Card>
    </div>
  );
};
