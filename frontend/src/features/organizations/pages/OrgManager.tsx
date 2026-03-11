import React from 'react';
import { Card, Table, Button, Typography, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { useOrgs } from '../hooks/useOrg';
import type { Organization } from '../types';
import { RequireRole } from '../../../shared/components/RequireRole';

const { Title, Text } = Typography;

export const OrgManager: React.FC = () => {
    const { data: orgs, isLoading } = useOrgs();
    const navigate = useNavigate();

    const handleOpenCreate = () => {
        navigate('/manage/org/manager/create');
    };

    const handleOpenEdit = (org: Organization) => {
        navigate(`/manage/org/manager/${org.id}/edit`);
    };

    const columns = [
        {
            title: 'Tổ chức',
            key: 'org',
            render: (_: any, record: Organization) => (
                <Space>
                    {/* Placeholder for Logo */}
                    <div className="w-8 h-8 rounded bg-gray-200" />
                    <Text strong>{record.name}</Text>
                </Space>
            )
        },
        {
            title: 'Liên hệ',
            key: 'contact',
            render: (_: any, record: Organization) => (
                <Space direction="vertical" size={0}>
                    <Text className="text-sm">{record.email}</Text>
                    <Text type="secondary" className="text-xs">{record.phone}</Text>
                </Space>
            )
        },
        {
            title: 'Cấu hình',
            key: 'config',
            render: (_: any, record: Organization) => (
                <Space>
                    <Tag color="cyan">{record.currency || 'VND'}</Tag>
                    <Text type="secondary" className="text-xs">{record.timezone || 'Asia/Ho_Chi_Minh'}</Text>
                </Space>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: Organization) => (
                // Chỉ hiển thị nút Sửa nếu role cho phép (Admin/Owner)
                <RequireRole allowedRoles={['Admin', 'Owner']}>
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)}>
                        Sửa
                    </Button>
                </RequireRole>
            )
        }
    ];

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                   <Title level={3} className="m-0">Quản lý Tổ chức</Title>
                   <Text type="secondary">Cài đặt công ty và ban quản lý</Text>
                </div>
                {/* Chỉ Admin mới được tạo mới Org theo specs (Owner tạo qua invite hoặc flow khác) */}
                <RequireRole allowedRoles={['Admin']}>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
                        Tạo tổ chức
                    </Button>
                </RequireRole>
            </div>

            <Card className="shadow-sm rounded-lg" bordered={false} bodyStyle={{ padding: 0 }}>
                <Table 
                    columns={columns} 
                    dataSource={orgs || []} 
                    rowKey="id" 
                    loading={isLoading}
                    pagination={false}
                />
            </Card>

        </div>
    );
};
