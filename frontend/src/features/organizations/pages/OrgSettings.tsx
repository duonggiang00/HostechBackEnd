import React, { useEffect } from 'react';
import { Card, Form, Input, Select, Button, Typography, Skeleton, Row, Col } from 'antd';
import { useOrgs, useUpdateOrg } from '../hooks/useOrg';
import type { OrgUpdatePayload } from '../types';

const { Title, Text } = Typography;

export const OrgSettings: React.FC = () => {
    const { data: orgs, isLoading } = useOrgs();
    const updateMutation = useUpdateOrg();
    const [form] = Form.useForm();

    // Owner typically has 1 organization returned from the backend scope.
    const myOrg = orgs?.[0];

    useEffect(() => {
        if (myOrg) {
            form.setFieldsValue({
                name: myOrg.name,
                phone: myOrg.phone,
                email: myOrg.email,
                address: myOrg.address,
                timezone: myOrg.timezone || 'Asia/Ho_Chi_Minh',
                currency: myOrg.currency || 'VND',
            });
        }
    }, [myOrg, form]);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (myOrg) {
                await updateMutation.mutateAsync({ id: myOrg.id, data: values as OrgUpdatePayload });
            }
        } catch (error) {
            // Error is handled by mutation or form
        }
    };

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 8 }} className="p-6" />;
    }

    if (!myOrg) {
        return (
            <div className="p-6">
                <Text type="secondary">Không tìm thấy thông tin tổ chức của bạn.</Text>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 bg-gray-50 min-h-full">
            <div className="mb-6">
                <Title level={3} className="m-0">Cài đặt Tổ chức</Title>
                <Text type="secondary">Quản lý thông tin chung và cấu hình hệ thống của tổ chức</Text>
            </div>

            <Card className="shadow-sm rounded-lg max-w-4xl" bordered={false}>
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Row gutter={24}>
                        <Col xs={24} md={12}>
                            <Form.Item label="Tên tổ chức / Thương hiệu" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên tổ chức' }]}>
                                <Input size="large" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Email liên hệ" name="email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                                <Input size="large" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Số điện thoại" name="phone">
                                <Input size="large" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Tiền tệ mặc định" name="currency">
                                <Select size="large">
                                    <Select.Option value="VND">VND - Việt Nam Đồng</Select.Option>
                                    <Select.Option value="USD">USD - Đô la Mỹ</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24}>
                            <Form.Item label="Địa chỉ văn phòng" name="address">
                                <Input.TextArea rows={3} size="large" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Múi giờ" name="timezone">
                                <Select size="large">
                                    <Select.Option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <div className="mt-6 flex justify-end">
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            size="large" 
                            loading={updateMutation.isPending}
                        >
                            Lưu thông tin
                        </Button>
                    </div>
                </Form>
            </Card>
        </div>
    );
};
