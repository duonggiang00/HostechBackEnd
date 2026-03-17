import React from 'react';
import { useTokenStore } from '../../../features/auth/stores/authStore';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router';

interface RoleGuardProps {
    allowedRoles: string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
    showForbidden?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
    allowedRoles, 
    children, 
    fallback = null,
    showForbidden = false 
}) => {
    const roles = useTokenStore((state: any) => state.roles || []);
    const navigate = useNavigate();

    // KTra xem user có role nào nằm trong mảng allowedRoles không
    const hasPermission = roles.some((r: string) => allowedRoles.includes(r));

    if (hasPermission) {
        return <>{children}</>;
    }

    if (showForbidden) {
        return (
            <Result
                status="403"
                title="403"
                subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
                extra={<Button type="primary" onClick={() => navigate('/')}>Về trang chủ</Button>}
            />
        );
    }

    return <>{fallback}</>;
};
