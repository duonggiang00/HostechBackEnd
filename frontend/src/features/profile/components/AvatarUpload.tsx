import React, { useState } from 'react';
import { Upload, message } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useUploadAvatar } from '../hooks/useProfile';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
}

const getBase64 = (img: RcFile, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result as string));
  reader.readAsDataURL(img);
};

const beforeUpload = (file: RcFile) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('Bạn chỉ có thể tải lên file JPG/PNG!');
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('Kích thước ảnh phải nhỏ hơn 2MB!');
  }
  return isJpgOrPng && isLt2M;
};

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ currentAvatarUrl }) => {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(currentAvatarUrl || undefined);
  const uploadMutation = useUploadAvatar();

  const handleChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
  };

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    try {
      setLoading(true);
      await uploadMutation.mutateAsync(file as File);
      
      // Hiển thị tạm ảnh vừa upload thành công
      getBase64(file as RcFile, (url) => {
        setLoading(false);
        setImageUrl(url);
      });
      
      if (onSuccess) onSuccess('ok');
    } catch (err: any) {
      setLoading(false);
      if (onError) onError(err);
    }
  };

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
    </button>
  );

  return (
    <Upload
      name="avatar"
      listType="picture-circle"
      className="avatar-uploader"
      showUploadList={false}
      beforeUpload={beforeUpload}
      onChange={handleChange}
      customRequest={customRequest}
    >
      {imageUrl ? <img src={imageUrl} alt="avatar" style={{ width: '100%', borderRadius: '50%', objectFit: 'cover', height: '100%' }} /> : uploadButton}
    </Upload>
  );
};
