import React, { useState } from "react";
import { Row, Col, Skeleton } from "antd";
import { useProfile } from "../hooks/useProfile";
import { ProfileSidebar } from "../components/ProfileSidebar";
import { PersonalInfoContent } from "../components/PersonalInfoContent";
import { ChangePasswordContent } from "../components/ChangePasswordContent";
import { Security2FAContent } from "../components/Security2FAContent";

export const ProfilePage: React.FC = () => {
  const { data: profile, isLoading } = useProfile();
  const [activeTab, setActiveTab] = useState("personal");

  if (isLoading) {
    return <Skeleton active avatar paragraph={{ rows: 6 }} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "personal":
        return <PersonalInfoContent profile={profile} />;
      case "password":
        return <ChangePasswordContent />;
      case "2fa":
        return (
          <Security2FAContent
            is2FAEnabled={profile?.two_factor_confirmed_at != null}
          />
        );
      default:
        return <PersonalInfoContent profile={profile} />;
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-full">
      <Row gutter={[24, 24]}>
        {/* Sidebar - 5 columns on desktop, full width on mobile */}
        <Col xs={24} md={6}>
          <ProfileSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            profile={profile}
          />
        </Col>

        {/* Main Content - 19 columns on desktop, full width on mobile */}
        <Col xs={24} md={18}>
          {renderContent()}
        </Col>
      </Row>
    </div>
  );
};
