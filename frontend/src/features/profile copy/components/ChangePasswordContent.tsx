import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Card, Input, Button, Form, Typography } from "antd";
import { useChangePassword } from "../hooks/useProfile";
import type { PasswordDataType } from "../types";
import { AlertCircle } from "lucide-react";

const { Title, Text, Paragraph } = Typography;

export const ChangePasswordContent: React.FC = () => {
  const { control, handleSubmit, reset, watch } = useForm<PasswordDataType>();
  const passwordMutation = useChangePassword();
  const newPassword = watch("password");

  const onSubmit = (data: PasswordDataType) => {
    passwordMutation.mutate(data, {
      onSuccess: () => reset(),
    });
  };

  return (
    <div>
      <div className="mb-6">
        <Title level={3} className="m-0">
          Đổi mật khẩu
        </Title>
        <Text type="secondary">
          Thay đổi mật khẩu để tăng cường bảo mật tài khoản
        </Text>
      </div>

      <Card className="shadow-sm rounded-2xl overflow-hidden" bordered={false}>
        {/* Security Info */}
        <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
          <div>
            <Text strong className="block text-blue-900">
              Sử dụng mật khẩu mạnh
            </Text>
            <Text type="secondary" className="text-sm">
              Mật khẩu của bạn nên chứa ít nhất 8 ký tự bao gồm chữ hoa, chữ
              thường, số và ký tự đặc biệt.
            </Text>
          </div>
        </div>

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item label="Mật khẩu hiện tại" required>
            <Controller
              name="current_password"
              control={control}
              rules={{ required: "Vui lòng nhập mật khẩu hiện tại" }}
              render={({ field, fieldState }) => (
                <>
                  <Input.Password
                    {...field}
                    size="large"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                  {fieldState.error && (
                    <Text type="danger" className="text-xs">
                      {fieldState.error.message}
                    </Text>
                  )}
                </>
              )}
            />
          </Form.Item>

          <Form.Item label="Mật khẩu mới" required>
            <Controller
              name="password"
              control={control}
              rules={{
                required: "Vui lòng nhập mật khẩu mới",
                minLength: {
                  value: 8,
                  message: "Mật khẩu phải có ít nhất 8 ký tự",
                },
              }}
              render={({ field, fieldState }) => (
                <>
                  <Input.Password
                    {...field}
                    size="large"
                    placeholder="Nhập mật khẩu mới"
                  />
                  {fieldState.error && (
                    <Text type="danger" className="text-xs">
                      {fieldState.error.message}
                    </Text>
                  )}
                </>
              )}
            />
          </Form.Item>

          <Form.Item label="Xác nhận mật khẩu mới" required>
            <Controller
              name="password_confirmation"
              control={control}
              rules={{
                required: "Vui lòng xác nhận mật khẩu mới",
                validate: (value) =>
                  value === newPassword || "Mật khẩu xác nhận không khớp",
              }}
              render={({ field, fieldState }) => (
                <>
                  <Input.Password
                    {...field}
                    size="large"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                  {fieldState.error && (
                    <Text type="danger" className="text-xs">
                      {fieldState.error.message}
                    </Text>
                  )}
                </>
              )}
            />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-6">
            <Button size="large" onClick={() => reset()}>
              Huỷ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={passwordMutation.isPending}
            >
              Cập nhật mật khẩu
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};
