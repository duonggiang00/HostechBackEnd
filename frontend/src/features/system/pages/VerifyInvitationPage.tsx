import React from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Card, Typography, Spin, Alert, Button } from 'antd';
import { useValidateInvitation } from '../hooks/useSystem';

const { Title, Text } = Typography;

export const VerifyInvitationPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const { data, isLoading, isError, error } = useValidateInvitation(token);

    if (!token) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Alert type="error" message="Không tìm thấy Token lời mời" showIcon />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
                <Spin size="large" />
                <Text className="mt-4">Đang xác thực lời mời...</Text>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Card className="text-center max-w-sm w-full">
                   <Alert 
                       type="error" 
                       message="Lời mời không hợp lệ hoặc đã hết hạn" 
                       description={(error as any)?.response?.data?.message || "Vui lòng liên hệ quản trị viên."}
                       showIcon 
                   />
                   <Button type="primary" className="mt-4 w-full" onClick={() => navigate('/auth')}>
                       Quay về trang đăng nhập
                   </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full shadow-lg rounded-2xl p-4">
                <Title level={4} className="text-center">Tạo tài khoản</Title>
                <Text type="secondary" className="block text-center mb-6">
                    Bạn đã được mời tham gia tổ chức: <Text strong>{data?.org_name || 'Hostech'}</Text>
                </Text>
                
                <Alert type="success" message={`Email hợp lệ: ${data?.email}`} className="mb-4" />
                
                <Button type="primary" size="large" className="w-full" onClick={() => navigate(`/auth/register?email=${data?.email}&token=${token}`)}>
                    Tiếp tục đăng ký tài khoản
                </Button>
            </Card>
        </div>
    );
};
