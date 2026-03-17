import React, { useState } from 'react';
import { Card, Table, Typography, Space, Tag, Input, Select, Button, Switch, Modal, Tooltip } from 'antd';
import { SearchOutlined, UserAddOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { useUsers, useUpdateUserStatus, useRemoveUser } from '../hooks/useUsers';
import type { UserFilters, UserType } from '../types';
import { RoleGuard } from '../../../shared/components/RoleGuard';

const { Title, Text } = Typography;

export const UserManager: React.FC = () => {
    const [filters, setFilters] = useState<UserFilters>({ page: 1, per_page: 15 });
    const { data, isLoading } = useUsers(filters);
    const updateStatusMutation = useUpdateUserStatus();
    const removeUserMutation = useRemoveUser();
    const navigate = useNavigate();
    
    // For rendering tags
    const getRoleColor = (role: string) => {
        switch (role) {
            case 'Admin': return 'red';
            case 'Owner': return 'gold';
            case 'Manager': return 'blue';
            case 'Staff': return 'cyan';
            default: return 'default';
        }
    };

    const handleTableChange = (pagination: any) => {
        setFilters({ ...filters, page: pagination.current, per_page: pagination.pageSize });
    };

    const handleSearch = (value: string) => {
        setFilters({ ...filters, search: value, page: 1 });
    };

    const handleRoleFilter = (value: string) => {
        setFilters({ ...filters, 'filter[role]': value, page: 1 });
    };



    const columns = [
        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            key: 'full_name',
            render: (text: string, record: UserType) => (
                <Space direction="vertical" size={0}>
                   <Text strong>{text || 'Chưa cập nhật'}</Text>
                   <Text type="secondary" className="text-xs">{record.email}</Text>
                </Space>
            )
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            render: (text: string) => <Text>{text || '--'}</Text>
        },
        {
            title: 'Chức vụ',
            key: 'roles',
            render: (_: any, record: UserType) => (
                <Space size={4} wrap>
                    {record.roles?.map(role => (
                        <Tag color={getRoleColor(role)} key={role}>{role}</Tag>
                    ))}
                </Space>
            )
        },
        {
            title: 'Tòa nhà quản lý',
            key: 'properties',
            render: (_: any, record: UserType) => (
                <Space size={4} wrap>
                    {record.properties?.map(prop => (
                        <Tag key={prop.id}>{prop.name}</Tag>
                    ))}
                </Space>
            )
        },
        {
            title: 'Trạng thái',
            key: 'is_active',
            render: (_: any, record: UserType) => (
                <RoleGuard allowedRoles={['Admin', 'Owner', 'Manager']} fallback={<Tag color={record.is_active ? 'green' : 'red'}>{record.is_active ? 'Active' : 'Locked'}</Tag>}>
                    <Switch 
                        checked={record.is_active} 
                        onChange={(checked) => updateStatusMutation.mutate({ id: record.id, is_active: checked })}
                        loading={updateStatusMutation.isPending}
                    />
                </RoleGuard>
            )
        },
        {
            title: 'Thao tác',
            key: 'actions',
            render: (_: any, record: UserType) => (
                <RoleGuard allowedRoles={['Admin', 'Owner']}>
                    <Tooltip title="Gỡ khỏi tổ chức">
                        <Button 
                           danger 
                           type="text" 
                           icon={<DeleteOutlined />} 
                           onClick={() => {
                               Modal.confirm({
                                   title: 'Xóa người dùng?',
                                   content: `Bạn có chắc muốn gỡ ${record.full_name} khỏi tổ chức?`,
                                   onOk: () => removeUserMutation.mutateAsync(record.id)
                               });
                           }}
                        />
                    </Tooltip>
                </RoleGuard>
            )
        }
    ];

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                   <Title level={3} className="m-0">Quản lý Nhân sự & Người dùng</Title>
                   <Text type="secondary">Danh sách thành viên và phân quyền truy cập</Text>
                </div>
                
                {/* Chỉ có Admin/Owner/Manager mới đc mời */}
                <RoleGuard allowedRoles={['Admin', 'Owner', 'Manager']}>
                    <Button type="primary" icon={<UserAddOutlined />} onClick={() => navigate('/manage/users/invite')}>
                        Mời thành viên
                    </Button>
                </RoleGuard>
            </div>

            <Card className="shadow-sm rounded-lg mb-4" bordered={false} bodyStyle={{ padding: '16px' }}>
                <div className="flex flex-col md:flex-row gap-4">
                    <Input 
                        placeholder="Tìm kiếm theo tên, email, SDT..." 
                        prefix={<SearchOutlined className="text-gray-400" />}
                        allowClear
                        onPressEnter={(e: any) => handleSearch(e.target.value)}
                        onBlur={(e: any) => handleSearch(e.target.value)}
                        className="max-w-md"
                    />
                    <Select 
                        placeholder="Lọc theo chức vụ" 
                        allowClear 
                        style={{ width: 200 }}
                        onChange={handleRoleFilter}
                        options={[
                            { value: 'Admin', label: 'Admin (System)' },
                            { value: 'Owner', label: 'Chủ sở hữu' },
                            { value: 'Manager', label: 'Quản lý cơ sở' },
                            { value: 'Staff', label: 'Nhân viên' },
                            { value: 'Tenant', label: 'Khách thuê' }
                        ]}
                    />
                </div>
            </Card>

            <Card className="shadow-sm rounded-lg" bordered={false} bodyStyle={{ padding: 0 }}>
                <Table 
                    columns={columns} 
                    dataSource={data?.data || []} 
                    rowKey="id" 
                    loading={isLoading}
                    pagination={{
                        current: data?.meta?.current_page || 1,
                        pageSize: data?.meta?.per_page || 15,
                        total: data?.meta?.total || 0,
                        showSizeChanger: true
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                />
            </Card>

        </div>
    );
};
