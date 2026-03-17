import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, Form, Input, Button, Typography, Result, Spin } from 'antd';
import { validateInvitation } from '../../system/api/systemApi';
import { registerUser } from '../api/authApi';
import { useTokenStore } from '../stores/authStore';

const { Title, Text } = Typography;

export const AcceptInvite: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const setToken = useTokenStore(state => state.setToken);
    const [form] = Form.useForm();

    const { data: inviteData, isLoading, isError } = useQuery({
        queryKey: ['validate-invite', token],
        queryFn: () => validateInvitation(token!),
        enabled: !!token,
        retry: false
    });

    const registerMutation = useMutation({
        mutationFn: (data: any) => registerUser({ ...data, token }),
        onSuccess: (res: any) => {
            // Tùy thuộc backend, registerUser có thể trả về token luôn không
            if (res?.data?.token || res?.token) {
                const authToken = res.data?.token || res.token;
                const user = res.data?.user || res.user;
                setToken(authToken, user?.roles || ['Tenant'], user?.permissions || [], user?.org_id || null);
            }
            navigate('/manage');
        }
    });

    const onFinish = (values: any) => {
        registerMutation.mutate({
            full_name: values.full_name,
            password: values.password,
            password_confirmation: values.password_confirmation,
            email: inviteData?.email, // Backend might need this if checking
        });
    };

    if (isLoading) {
        return (
            <div className="flex bg-gray-50 min-h-screen items-center justify-center">
                <Spin size="large" tip="Đang kiểm tra lời mời..." />
            </div>
        );
    }

    if (isError || !inviteData) {
        return (
            <div className="flex bg-gray-50 min-h-screen items-center justify-center p-4">
                <Card className="max-w-md w-full shadow-lg rounded-2xl">
                    <Result
                        status="warning"
                        title="Lời mời không hợp lệ hoặc đã hết hạn"
                        subTitle="Vui lòng liên hệ Quản trị viên để được cấp lại lời mời mới."
                        extra={
                            <Button type="primary" onClick={() => navigate('/auth/login')}>
                                Về trang Đăng nhập
                            </Button>
                        }
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="flex bg-gray-50 min-h-screen items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-lg rounded-2xl border-0">
                <div className="text-center mb-6">
                    <Title level={3} className="m-0 text-blue-600">Gia nhập Tổ chức</Title>
                    <Text type="secondary" className="block mt-2">
                        Lời mời gửi đến <strong className="text-black">{inviteData.email}</strong>
                    </Text>
                </div>

                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item 
                        label="Họ và tên" 
                        name="full_name" 
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                        <Input size="large" placeholder="Nhập họ và tên của bạn" />
                    </Form.Item>

                    <Form.Item 
                        label="Mật khẩu" 
                        name="password" 
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu' },
                            { min: 8, message: 'Mật khẩu phải từ 8 ký tự' }
                        ]}
                    >
                        <Input.Password size="large" placeholder="Tạo mật khẩu" />
                    </Form.Item>

                    <Form.Item 
                        label="Xác nhận mật khẩu" 
                        name="password_confirmation" 
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                  if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                  }
                                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password size="large" placeholder="Nhập lại mật khẩu" />
                    </Form.Item>

                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        size="large" 
                        className="w-full mt-2" 
                        loading={registerMutation.isPending}
                    >
                        Hoàn tất Đăng ký
                    </Button>
                </Form>
            </Card>
        </div>
    );
};
