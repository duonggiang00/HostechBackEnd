import React, { useEffect } from 'react';
import { Select, Spin, Space, Typography } from 'antd';
import { BankOutlined } from '@ant-design/icons';
import { useOrgs } from '../hooks/useOrg';
import { useOrgStore } from '../stores/orgStore';

const { Text } = Typography;

export const OrgSwitcher: React.FC = () => {
    const { data: orgs, isLoading } = useOrgs();
    const activeOrg = useOrgStore((state) => state.activeOrg);
    const setActiveOrg = useOrgStore((state) => state.setActiveOrg);

    // Auto-select first org if none selected and orgs are loaded
    useEffect(() => {
        if (!activeOrg && orgs && orgs.length > 0) {
            setActiveOrg(orgs[0]);
        }
    }, [orgs, activeOrg, setActiveOrg]);

    if (isLoading) {
        return <Spin size="small" />;
    }

    if (!orgs || orgs.length === 0) {
        return <Text type="secondary" className="text-sm">Không có Tổ chức nào</Text>;
    }

    const handleChange = (orgId: string) => {
        const selected = orgs.find((org) => org.id === orgId);
        if (selected) {
            setActiveOrg(selected);
        }
    };

    return (
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded px-2 py-1">
            <Space>
               <BankOutlined className="text-gray-500" />
               <Select
                   size="small"
                   value={activeOrg?.id}
                   onChange={handleChange}
                   variant="borderless"
                   style={{ minWidth: 150 }}
                   options={orgs.map((org) => ({
                       value: org.id,
                       label: <Text strong className="text-xs">{org.name}</Text>
                   }))}
               />
            </Space>
        </div>
    );
};
