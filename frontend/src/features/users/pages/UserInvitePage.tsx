import React from 'react';
import { Card, Form, Input, Select, Button, Typography, Space, message } from 'antd';
import { useNavigate } from 'react-router';
import { useSendInvitation } from '../hooks/useUsers';
import { RequireRole } from '../../../shared/components/RequireRole';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Text } = Typography;

export const UserInvitePage: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const inviteMutation = useSendInvitation();

    const handleSendInvite = async () => {
        try {
            const values = await form.validateFields();
            await inviteMutation.mutateAsync(values);
            message.success('Lời mời đã được gửi thành công!');
            navigate('/manage/users');
        } catch (e) {
            if (e && typeof e === 'object' && 'errorFields' in e) return;
            message.error('Có lỗi xảy ra khi gửi lời mời.');
        }
    };

    return (
        <div className="p-4 md:p-6 min-h-full bg-gray-50">
            <Space className="mb-4">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/manage/users')}>
                    Quay lại danh sách
                </Button>
            </Space>
            
            <Card title="Gửi Lời Mời Thành Viên Mới" className="max-w-2xl mx-auto shadow-sm">
                <div className="mb-6">
                    <Text type="secondary">
                        Hệ thống sẽ gửi một email kèm link đăng ký đến người dùng. Sau khi điền mật khẩu tại link, người dùng sẽ chính thức gia nhập tổ chức với phân quyền bạn đã chọn.
                    </Text>
                </div>
                
                <Form form={form} layout="vertical" onFinish={handleSendInvite}>
                    <Form.Item label="Email người nhận" name="email" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}>
                        <Input placeholder="ví dụ: staff@hostech.vn" size="large" />
                    </Form.Item>
                    <Form.Item label="Phân quyền (Role)" name="role" rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}>
                        <Select placeholder="Chọn chức vụ" size="large">
                            {/* Tenant is invited mostly through Contracts, but allowed here manually too */}
                            <Select.Option value="Manager">Quản lý cơ sở (Manager)</Select.Option>
                            <Select.Option value="Staff">Nhân viên (Staff)</Select.Option>
                            <Select.Option value="Tenant">Khách thuê (Tenant)</Select.Option>
                            <RequireRole allowedRoles={['Admin']}>
                                <Select.Option value="Owner">Chủ sở hữu (Owner)</Select.Option>
                            </RequireRole>
                        </Select>
                    </Form.Item>
                    <Form.Item label="Ghi chú thêm" name="note">
                        <Input.TextArea rows={4} placeholder="Nội dung lời nhắn kèm theo thư mời..." />
                    </Form.Item>

                    <Form.Item className="mt-8 mb-0">
                        <Space className="w-full justify-end">
                            <Button size="large" onClick={() => navigate('/manage/users')}>Hủy bỏ</Button>
                            <Button size="large" type="primary" htmlType="submit" loading={inviteMutation.isPending}>
                                Gửi lời mời
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};
