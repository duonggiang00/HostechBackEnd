import React, { useState } from 'react';
import { Table, Button, Space, Card, Form, InputNumber, Select, message, Spin, Typography, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getServices } from '../api/serviceApi';
import { useRoomServices, useAssignRoomService, useUpdateRoomService, useRemoveRoomService } from '../hooks/useRoomServices';
import type { RoomService, AssignServicePayload, UpdateRoomServicePayload } from '../hooks/useRoomServices';
import { RequireRole } from '../../../shared/components/RequireRole';
import { ServiceCalcModeLabels } from '../types';

const { Text } = Typography;

interface Props {
  roomId: string;
}

export const RoomServiceAssigner: React.FC<Props> = ({ roomId }) => {
  const { data: globalServices, isLoading: isLoadingGlobal } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });
  
  const { data: roomServices, isLoading: isLoadingRoom } = useRoomServices(roomId);
  const assignMutation = useAssignRoomService(roomId);
  const updateMutation = useUpdateRoomService(roomId);
  const removeMutation = useRemoveRoomService(roomId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const payload = {
        quantity: values.quantity || 1,
        included_units: values.included_units || 0,
        meta: values.custom_price ? { custom_price: values.custom_price } : {},
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload as UpdateRoomServicePayload });
        message.success("Cập nhật dịch vụ thành công");
      } else {
        await assignMutation.mutateAsync({ ...payload, service_id: values.service_id } as AssignServicePayload);
        message.success("Gán dịch vụ thành công");
      }
      setIsFormOpen(false);
    } catch (e) {
      if ((e as Error).message) {
         message.error("Có lỗi xảy ra");
      }
    }
  };

  const handleEdit = (record: RoomService) => {
    setEditingId(record.id);
    form.setFieldsValue({
      service_id: record.service_id,
      quantity: record.quantity,
      included_units: record.included_units,
      custom_price: record.meta?.custom_price || null,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await removeMutation.mutateAsync(id);
      message.success("Đã gỡ dịch vụ khỏi phòng");
    } catch (e) {
      message.error("Gỡ dịch vụ thất bại");
    }
  };

  const openAssignModal = () => {
    setEditingId(null);
    form.resetFields();
    // Default values
    form.setFieldsValue({ quantity: 1, included_units: 0 });
    setIsFormOpen(true);
  };

  const getUnassignedServices = () => {
    if (!globalServices || !roomServices) return [];
    const assignedIds = roomServices.map(rs => rs.service_id);
    return globalServices.filter(gs => !assignedIds.includes(gs.id) && gs.is_active);
  };

  const columns = [
    {
      title: 'Dịch vụ',
      dataIndex: ['service', 'name'],
      key: 'service_name',
      render: (text: string, record: RoomService) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text || record.service?.code}</Text>
          <Text type="secondary" className="text-xs">{ServiceCalcModeLabels[record.service?.calc_mode as keyof typeof ServiceCalcModeLabels] || record.service?.calc_mode}</Text>
        </Space>
      ),
    },
    {
      title: 'Đơn giá',
      key: 'price',
      render: (_: any, record: RoomService) => {
        const customPrice = record.meta?.custom_price;
        const defaultPrice = record.service?.current_rate?.price || 0;
        return (
          <Space>
            <Text>{customPrice ? customPrice.toLocaleString() : defaultPrice.toLocaleString()} đ</Text>
            {customPrice && <Tag color="blue">Giá tùy chỉnh</Tag>}
          </Space>
        );
      }
    },
    {
      title: 'Số lượng / Định mức bao',
      key: 'metrics',
      render: (_: any, record: RoomService) => (
         <Space direction="vertical" size={0}>
            {record.quantity > 1 ? <Text>SL: {record.quantity}</Text> : null}
            {record.included_units > 0 ? <Text type="success">Miễn phí {record.included_units} {record.service?.unit}</Text> : null}
            {record.quantity === 1 && record.included_units === 0 ? <Text type="secondary">Mặc định</Text> : null}
         </Space>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: RoomService) => (
        <RequireRole allowedRoles={['Owner', 'Manager', 'Staff']}>
          <Space>
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            <Popconfirm title="Gỡ dịch vụ này?" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        </RequireRole>
      ),
    },
  ];

  if (isLoadingRoom || isLoadingGlobal) return <div className="p-4 text-center"><Spin /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Text strong>Các dịch vụ đang sử dụng ({roomServices?.length || 0})</Text>
        <RequireRole allowedRoles={['Owner', 'Manager']}>
          {!isFormOpen && (
              <Button type="dashed" icon={<PlusOutlined />} onClick={openAssignModal}>Gán dịch vụ</Button>
          )}
        </RequireRole>
      </div>

      <Table 
        columns={columns} 
        dataSource={roomServices} 
        rowKey="id" 
        pagination={false} 
        size="small" 
      />

      {isFormOpen && (
        <Card title={editingId ? "Cập nhật dịch vụ phòng" : "Gán dịch vụ mới"} className="mt-4 shadow-sm" bodyStyle={{ paddingBottom: 8 }}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item 
              label="Chọn dịch vụ hệ thống" 
              name="service_id" 
              rules={[{ required: true, message: 'Vui lòng chọn dịch vụ' }]}
            >
               <Select disabled={!!editingId} placeholder="Chọn dịch vụ...">
                  {getUnassignedServices().map(s => (
                    <Select.Option key={s.id} value={s.id}>
                      {s.name} ({s.current_rate?.price?.toLocaleString() || 0} đ)
                    </Select.Option>
                  ))}
               </Select>
            </Form.Item>

            <Form.Item label="Giá tùy chỉnh (Tùy chọn)" name="custom_price" extra="Thu giá khác với giá gốc của hệ thống (nếu có). Để trống nếu dùng giá gốc.">
               <InputNumber className="w-full" min={0} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>

            <div className="flex gap-4">
               <Form.Item label="Số lượng" name="quantity" className="flex-1" rules={[{ required: true }]}>
                 <InputNumber min={1} className="w-full" />
               </Form.Item>
               <Form.Item label="Định mức bao" name="included_units" className="flex-1" extra="VD: Miễn phí 5 khối nước đầu">
                 <InputNumber min={0} className="w-full" />
               </Form.Item>
            </div>
            
            <Form.Item className="mb-0 mt-4 flex justify-end">
               <Space>
                  <Button onClick={() => setIsFormOpen(false)}>Hủy</Button>
                  <Button type="primary" htmlType="submit" loading={assignMutation.isPending || updateMutation.isPending}>
                     Lưu lại
                  </Button>
               </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
};
