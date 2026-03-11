import React, { useEffect } from 'react';
import { Card, Form, Input, Select, Button, Typography, Space, message } from 'antd';
import { useNavigate, useParams } from 'react-router';
import { useCreateOrg, useUpdateOrg, useOrgs } from '../hooks/useOrg';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { OrgCreatePayload } from '../types';

const { Title, Text } = Typography;

export const OrgFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const [form] = Form.useForm();
    
    // We can fetch the list of orgs and find the specific one to edit
    const { data: orgs, isLoading: isOrgsLoading } = useOrgs();
    const createMutation = useCreateOrg();
    const updateMutation = useUpdateOrg();
    
    useEffect(() => {
        if (isEdit && orgs) {
            const org = orgs.find(o => String(o.id) === id);
            if (org) {
                form.setFieldsValue({
                    name: org.name,
                    phone: org.phone,
                    email: org.email,
                    address: org.address,
                    timezone: org.timezone || 'Asia/Ho_Chi_Minh',
                    currency: org.currency || 'VND',
                });
            }
        }
    }, [isEdit, id, orgs, form]);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (isEdit) {
                await updateMutation.mutateAsync({ id: id as string, data: values });
                message.success('Cập nhật tổ chức thành công!');
            } else {
                await createMutation.mutateAsync(values as OrgCreatePayload);
                message.success('Tạo tổ chức thành công!');
            }
            navigate('/manage/org/manager');
        } catch (error) {
            if (error && typeof error === 'object' && 'errorFields' in error) return;
            message.error('Có lỗi xảy ra, vui lòng thử lại.');
        }
    };

    return (
        <div className="p-4 md:p-6 min-h-full bg-gray-50">
            <Space className="mb-4">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/manage/org/manager')}>
                    Quay lại danh sách
                </Button>
            </Space>

            <Card className="max-w-3xl mx-auto shadow-sm" loading={isEdit && isOrgsLoading}>
                <div className="mb-6">
                    <Title level={3} className="m-0">
                        {isEdit ? 'Sửa thông tin Tổ chức' : 'Tạo Tổ chức mới'}
                    </Title>
                    <Text type="secondary">
                        {isEdit ? 'Cập nhật các thông tin cơ bản cho tổ chức.' : 'Thiết lập khởi tạo cho chủ sở hữu tổ chức mới.'}
                    </Text>
                </div>

                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item label="Tên tổ chức / Dự án" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                        <Input size="large" />
                    </Form.Item>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item label="Số điện thoại" name="phone">
                            <Input size="large" />
                        </Form.Item>
                        <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                            <Input size="large" />
                        </Form.Item>
                    </div>

                    <Form.Item label="Địa chỉ" name="address">
                        <Input.TextArea rows={3} size="large" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item label="Tiền tệ" name="currency" initialValue="VND">
                            <Select size="large">
                                <Select.Option value="VND">VND</Select.Option>
                                <Select.Option value="USD">USD</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label="Múi giờ" name="timezone" initialValue="Asia/Ho_Chi_Minh">
                            <Select size="large">
                                <Select.Option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item className="mt-8 mb-0">
                        <Space className="w-full justify-end">
                            <Button size="large" onClick={() => navigate('/manage/org/manager')}>Hủy bỏ</Button>
                            <Button size="large" type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
                                {isEdit ? 'Lưu thay đổi' : 'Hoàn tất tạo'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};
