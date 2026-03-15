import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Card,
  Input,
  Button,
  Form,
  Row,
  Col,
  Typography,
  DatePicker,
} from "antd";
import { useUpdateProfile } from "../hooks/useProfile";
import { AvatarUpload } from "./AvatarUpload";
import type { ProfileType } from "../types";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface PersonalInfoContentProps {
  profile?: ProfileType;
}

export const PersonalInfoContent: React.FC<PersonalInfoContentProps> = ({
  profile,
}) => {
  const { control, handleSubmit, reset } = useForm<ProfileType>();
  const updateMutation = useUpdateProfile();

  useEffect(() => {
    if (profile) {
      reset({
        ...profile,
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: ProfileType) => {
    const payload = {
      ...data,
      date_of_birth: data.date_of_birth
        ? dayjs(data.date_of_birth).format("YYYY-MM-DD")
        : null,
    };
    updateMutation.mutate(payload);
  };

  return (
    <div>
      <div className="mb-6">
        <Title level={3} className="m-0">
          Thông tin cá nhân
        </Title>
        <Text type="secondary">Cập nhật thông tin hồ sơ của bạn</Text>
      </div>

      <Card className="shadow-sm rounded-2xl overflow-hidden" bordered={false}>
        <Row gutter={[32, 32]}>
          <Col
            xs={24}
            md={8}
            className="flex flex-col items-center justify-start border-r border-gray-100"
          >
            <AvatarUpload currentAvatarUrl={profile?.avatar_url} />
            <Title level={4} className="mt-4 mb-0">
              {profile?.full_name}
            </Title>
          </Col>

          <Col xs={24} md={16}>
            <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item label="Họ và tên" required>
                  <Controller
                    name="full_name"
                    control={control}
                    rules={{ required: "Vui lòng nhập họ tên" }}
                    render={({ field, fieldState }) => (
                      <>
                        <Input {...field} size="large" />
                        {fieldState.error && (
                          <Text type="danger" className="text-xs">
                            {fieldState.error.message}
                          </Text>
                        )}
                      </>
                    )}
                  />
                </Form.Item>

                <Form.Item label="Email">
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} size="large" disabled />
                    )}
                  />
                </Form.Item>

                <Form.Item label="Số điện thoại">
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        size="large"
                      />
                    )}
                  />
                </Form.Item>

                <Form.Item label="CCCD / CMND">
                  <Controller
                    name="identity_number"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value || ""}
                        size="large"
                      />
                    )}
                  />
                </Form.Item>

                <Form.Item label="Ngày sinh">
                  <Controller
                    name="date_of_birth"
                    control={control}
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
                    control={control}
                    render={({ field }) => (
                      <Input.TextArea
                        {...field}
                        value={field.value || ""}
                        rows={3}
                        size="large"
                      />
                    )}
                  />
                </Form.Item>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={updateMutation.isPending}
                >
                  Lưu thay đổi
                </Button>
              </div>
            </Form>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
