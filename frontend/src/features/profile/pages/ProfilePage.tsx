import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card, Input, Button, Form, Skeleton, Tabs, Row, Col, Typography, DatePicker } from 'antd';
import { useProfile, useUpdateProfile, useChangePassword } from '../hooks/useProfile';
import type { ProfileType, PasswordDataType } from '../types';
import { AvatarUpload } from '../components/AvatarUpload';
import { Setup2FA } from '../components/Setup2FA';
import dayjs from 'dayjs';
import { useTokenStore } from '../../auth/stores/authStore';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();
  const passwordMutation = useChangePassword();
  
  const { control: controlProfile, handleSubmit: handleSubmitProfile, reset: resetProfile } = useForm<ProfileType>();
  const { control: controlPwd, handleSubmit: handleSubmitPwd, reset: resetPwd } = useForm<PasswordDataType>();
  
  const role = useTokenStore(state => state.role);

  useEffect(() => {
    if (profile) {
      resetProfile({
        ...profile,
      });
    }
  }, [profile, resetProfile]);

  const onUpdateProfile = (data: ProfileType) => {
    // Convert dayjs obj back to string for backend if needed
    const payload = {
      ...data,
      date_of_birth: data.date_of_birth ? dayjs(data.date_of_birth).format('YYYY-MM-DD') : null,
    };
    updateMutation.mutate(payload);
  };

  const onChangePassword = (data: PasswordDataType) => {
    passwordMutation.mutate(data, {
      onSuccess: () => resetPwd(),
    });
  };

  if (isLoading) {
    return <Skeleton active avatar paragraph={{ rows: 6 }} />;
  }

  const items = [
    {
      key: '1',
      label: 'Thông tin cá nhân',
      children: (
        <Row gutter={[32, 32]}>
          <Col xs={24} md={8} className="flex flex-col items-center justify-start border-r border-gray-100">
             <AvatarUpload currentAvatarUrl={profile?.avatar_url} />
             <Title level={4} className="mt-4 mb-0">{profile?.full_name}</Title>
             <Text type="secondary">{role}</Text>
          </Col>
          <Col xs={24} md={16}>
            <Form layout="vertical" onFinish={handleSubmitProfile(onUpdateProfile)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item label="Họ và tên" required>
                  <Controller
                    name="full_name"
                    control={controlProfile}
                    rules={{ required: 'Vui lòng nhập họ tên' }}
                    render={({ field, fieldState }) => (
                      <>
                        <Input {...field} size="large" />
                        {fieldState.error && <Text type="danger" className="text-xs">{fieldState.error.message}</Text>}
                      </>
                    )}
                  />
                </Form.Item>

                <Form.Item label="Email">
                  <Controller
                    name="email"
                    control={controlProfile}
                    render={({ field }) => (
                      <Input {...field} size="large" disabled />
                    )}
                  />
                </Form.Item>

                <Form.Item label="Số điện thoại">
                  <Controller
                    name="phone"
                    control={controlProfile}
                    render={({ field }) => (
                      <Input {...field} value={field.value || ''} size="large" />
                    )}
                  />
                </Form.Item>

                <Form.Item label="CCCD / CMND">
                  <Controller
                    name="identity_number"
                    control={controlProfile}
                    render={({ field }) => (
                      <Input {...field} value={field.value || ''} size="large" />
                    )}
                  />
                </Form.Item>

                <Form.Item label="Ngày sinh">
                  <Controller
                    name="date_of_birth"
                    control={controlProfile}
                    render={({ field }) => (
                      <DatePicker 
                        {...field} 
                        size="large" 
                        className="w-full" 
                        format="DD/MM/YYYY"
                        value={field.value ? dayjs(field.value) : null}
                      />
                    )}
                  />
                </Form.Item>

                <Form.Item label="Địa chỉ" className="md:col-span-2">
                  <Controller
                    name="address"
                    control={controlProfile}
                    render={({ field }) => (
                      <Input.TextArea {...field} value={field.value || ''} rows={3} size="large" />
                    )}
                  />
                </Form.Item>
              </div>

              <div className="flex justify-end mt-4">
                <Button type="primary" htmlType="submit" size="large" loading={updateMutation.isPending}>
                  Lưu thay đổi
                </Button>
              </div>
            </Form>
          </Col>
        </Row>
      ),
    },
    {
      key: '2',
      label: 'Đổi mật khẩu',
      children: (
        <div className="max-w-md mx-auto py-8">
           <Form layout="vertical" onFinish={handleSubmitPwd(onChangePassword)}>
              <Form.Item label="Mật khẩu hiện tại" required>
                <Controller
                  name="current_password"
                  control={controlPwd}
                  rules={{ required: 'Vui lòng nhập mật khẩu hiện tại' }}
                  render={({ field, fieldState }) => (
                    <>
                      <Input.Password {...field} size="large" />
                      {fieldState.error && <Text type="danger" className="text-xs">{fieldState.error.message}</Text>}
                    </>
                  )}
                />
              </Form.Item>

              <Form.Item label="Mật khẩu mới" required>
                <Controller
                  name="password"
                  control={controlPwd}
                  rules={{ required: 'Vui lòng nhập mật khẩu mới', minLength: { value: 8, message: 'Tối thiểu 8 ký tự' } }}
                  render={({ field, fieldState }) => (
                    <>
                      <Input.Password {...field} size="large" />
                      {fieldState.error && <Text type="danger" className="text-xs">{fieldState.error.message}</Text>}
                    </>
                  )}
                />
              </Form.Item>

              <Form.Item label="Xác nhận mật khẩu mới" required>
                <Controller
                  name="password_confirmation"
                  control={controlPwd}
                  rules={{ required: 'Vui lòng nhập lại mật khẩu' }}
                  render={({ field, fieldState }) => (
                    <>
                      <Input.Password {...field} size="large" />
                      {fieldState.error && <Text type="danger" className="text-xs">{fieldState.error.message}</Text>}
                    </>
                  )}
                />
              </Form.Item>

              <Button type="primary" htmlType="submit" size="large" className="w-full" loading={passwordMutation.isPending}>
                Cập nhật mật khẩu
              </Button>
           </Form>
        </div>
      )
    },
    {
       key: '3',
       label: 'Bảo mật 2 Lớp (2FA)',
       children: (
         <Setup2FA is2FAEnabled={profile?.two_factor_confirmed_at != null} />
       )
    }
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-full">
      <div className="mb-6">
        <Title level={3} className="m-0">Hồ sơ cá nhân</Title>
        <Text type="secondary">Quản lý thông tin và cài đặt bảo mật cho tài khoản của bạn</Text>
      </div>
      
      <Card className="shadow-sm rounded-2xl overflow-hidden" bordered={false}>
        <Tabs defaultActiveKey="1" items={items} size="large" />
      </Card>
    </div>
  );
};
