import React from 'react';
import { Card, Table, Typography, Tag, Space } from 'antd';
import dayjs from 'dayjs';
import { useAuditLogs } from '../hooks/useSystem';
import type { AuditLogType } from '../types';

const { Title, Text } = Typography;

export const AuditLogsPage: React.FC = () => {
  const { data: logs, isLoading } = useAuditLogs();

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm:ss'),
      width: 170,
    },
    {
      title: 'Hành động',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string, record: AuditLogType) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.event?.toUpperCase() || 'ACTION'} {record.subject_type}</Text>
          <Text type="secondary" className="text-xs">{desc}</Text>
        </Space>
      ),
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'causer',
      key: 'causer',
      render: (causer: any) => causer ? <Tag color="blue">{causer.name || causer.full_name}</Tag> : <Text type="secondary">System</Text>,
    },
    {
      title: 'Dữ liệu thay đổi',
      key: 'properties',
      render: (_: any, record: AuditLogType) => (
        <div style={{ maxWidth: 400, overflowX: 'auto' }}>
          {record.properties?.old && (
            <div className="mb-1">
              <Text type="danger" className="text-xs">Cũ: {JSON.stringify(record.properties.old)}</Text>
            </div>
          )}
          {record.properties?.attributes && (
            <div>
              <Text type="success" className="text-xs">Mới: {JSON.stringify(record.properties.attributes)}</Text>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-full">
      <div className="mb-6">
        <Title level={3} className="m-0">Nhật ký Hệ thống (Audit Logs)</Title>
        <Text type="secondary">Theo dõi các thay đổi và hoạt động trên hệ thống</Text>
      </div>
      
      <Card className="shadow-sm rounded-lg" bordered={false} bodyStyle={{ padding: 0 }}>
          <Table 
            columns={columns} 
            dataSource={logs || []} 
            rowKey="id" 
            loading={isLoading}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 800 }}
          />
      </Card>
    </div>
  );
};
