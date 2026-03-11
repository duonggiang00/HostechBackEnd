import React, { useState } from 'react';
import { Button, Alert, Typography, Input, Divider, Skeleton } from 'antd';
import { 
  useEnableTwoFactor, 
  useDisableTwoFactor, 
  useConfirmTwoFactor, 
  useRegenerateRecoveryCodes, 
  useTwoFactorQrCode, 
  useTwoFactorRecoveryCodes 
} from '../hooks/useProfile';

const { Title, Text, Paragraph } = Typography;

interface Setup2FAProps {
  is2FAEnabled: boolean; // Trạng thái hiện hành từ Backend User Profile
}

export const Setup2FA: React.FC<Setup2FAProps> = ({ is2FAEnabled }) => {
  const [setupMode, setSetupMode] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');

  const enableMutation = useEnableTwoFactor();
  const disableMutation = useDisableTwoFactor();
  const confirmMutation = useConfirmTwoFactor();
  const regenerateMutation = useRegenerateRecoveryCodes();

  // Chỉ gọi fetch QR và Recovery codes khi User đã click nút Bật 2FA
  const { data: qrData, isLoading: isLoadingQr } = useTwoFactorQrCode(setupMode || is2FAEnabled);
  const { data: recoveryCodes, isLoading: isLoadingCodes } = useTwoFactorRecoveryCodes(is2FAEnabled);

  const handleEnableClick = () => {
    enableMutation.mutate(undefined, {
      onSuccess: () => setSetupMode(true),
    });
  };

  const handleDisableClick = () => {
    disableMutation.mutate(undefined, {
      onSuccess: () => {
        setSetupMode(false);
        setConfirmCode('');
      },
    });
  };

  const handleConfirm = () => {
    if (confirmCode.length === 6) {
      confirmMutation.mutate(confirmCode, {
        onSuccess: () => {
           setSetupMode(false); // Hoàn tất setup, quay về màn hình thông tin
        }
      });
    }
  };

  const handleRegenerateCodes = () => {
    regenerateMutation.mutate();
  };

  // --- RENDERING VIEWS ---

  if (is2FAEnabled && !setupMode) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Alert 
           message="Xác thực 2 yếu tố đang BẬT" 
           description="Tài khoản của bạn đang được bảo vệ bổ sung bằng mã xác thực từ ứng dụng Authenticator."
           type="success" 
           showIcon 
           className="mb-6"
        />

        <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <Title level={5}>Mã khôi phục (Recovery Codes)</Title>
          <Text type="secondary" className="block mb-4">
            Lưu trữ các mã này ở nơi an toàn. Chúng có thể được dùng để khôi phục tài khoản nếu bạn mất thiết bị xác thực 2 bước.
          </Text>

          {isLoadingCodes ? <Skeleton active paragraph={{ rows: 4 }} /> : (
            <div className="grid grid-cols-2 gap-2 bg-white p-4 border border-gray-100 rounded">
              {(recoveryCodes as any)?.map((code: string, index: number) => (
                <code key={index} className="text-gray-800 bg-gray-100 px-2 py-1 rounded text-center">
                  {code}
                </code>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-3">
             <Button onClick={handleRegenerateCodes} loading={regenerateMutation.isPending}>
               Tạo mã khôi phục mới
             </Button>
          </div>
        </div>

        <Divider />

        <div className="flex justify-between items-center">
            <Text className="font-semibold text-gray-700">Tắt xác thực 2 yếu tố</Text>
            <Button 
               danger 
               type="primary" 
               onClick={handleDisableClick} 
               loading={disableMutation.isPending}
            >
               Tắt 2FA
            </Button>
        </div>
      </div>
    );
  }

  if (setupMode) {
    return (
       <div className="max-w-xl mx-auto py-8">
          <Title level={4}>Hoàn tất thiết lập 2FA</Title>
          
          <Paragraph>
             Để hoàn tất việc kích hoạt bảo mật 2 lớp, hãy quét mã QR bên dưới bằng ứng dụng Authy hoặc Google Authenticator trên điện thoại của bạn.
          </Paragraph>

          <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center my-6">
              {isLoadingQr ? (
                 <Skeleton.Image className="w-48 h-48" active />
              ) : (
                 <div className="mb-4 bg-white p-2 border-2 border-gray-100 rounded-md" dangerouslySetInnerHTML={{ __html: (qrData as any)?.svg || '' }} />
              )}
              
              <Text type="secondary" className="mb-2">Nhập mã 6 số từ ứng dụng để xác nhận:</Text>
              
              <div className="flex w-full max-w-xs items-center gap-2">
                 <Input 
                   size="large" 
                   maxLength={6} 
                   value={confirmCode}
                   onChange={e => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                   placeholder="000000"
                   className="text-center text-lg tracking-widest font-mono"
                 />
                 <Button 
                   type="primary" 
                   size="large" 
                   onClick={handleConfirm}
                   loading={confirmMutation.isPending}
                   disabled={confirmCode.length !== 6}
                 >
                   Xác nhận
                 </Button>
              </div>
          </div>
          
          <Button type="text" onClick={() => setSetupMode(false)}>Hủy bỏ</Button>
       </div>
    );
  }

  // View mặc định: Chưa kích hoạt 2FA
  return (
    <div className="py-8 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <Title level={4}>Xác thực 2 yếu tố (TOTP)</Title>
        <Text type="secondary" className="mb-6 block">
          Khi kích hoạt tính năng này, bạn sẽ nhận được một mã xác thực bảo mật thông qua ứng dụng Google Authenticator mỗi khi đăng nhập.
        </Text>
        <Button 
           type="primary" 
           size="large" 
           onClick={handleEnableClick} 
           loading={enableMutation.isPending}
           className="px-8"
        >
           Bật bảo mật 2 lớp
        </Button>
    </div>
  );
};
