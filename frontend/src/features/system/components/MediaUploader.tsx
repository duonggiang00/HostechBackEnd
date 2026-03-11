import React, { useState } from 'react';
import { Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useUploadMedia } from '../hooks/useSystem';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

interface MediaUploaderProps {
  onUploadSuccess?: (uuid: string, url: string) => void;
  onUploadRemove?: (uuid: string) => void;
  collection?: string;
  maxCount?: number;
  multiple?: boolean;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ 
  onUploadSuccess, 
  onUploadRemove,
  collection,
  maxCount = 1,
  multiple = false
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const uploadMutation = useUploadMedia();

  const handleRemove = (file: UploadFile) => {
    const newFileList = fileList.filter((item) => item.uid !== file.uid);
    setFileList(newFileList);
    if (onUploadRemove && file.response?.media_uuid) {
      onUploadRemove(file.response.media_uuid);
    }
  };

  const customRequest: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    try {
      const response = await uploadMutation.mutateAsync({ file: file as File, collection });
      if (onSuccess) {
        onSuccess(response);
      }
      if (onUploadSuccess) {
        onUploadSuccess(response.media_uuid, response.url);
      }
    } catch (err) {
      if (onError) onError(err as any);
    }
  };

  const uploadProps: UploadProps = {
    customRequest,
    onChange: (info) => setFileList(info.fileList),
    onRemove: handleRemove,
    fileList,
    maxCount,
    multiple,
  };

  return (
    <Upload {...uploadProps}>
      {fileList.length < maxCount && (
        <Button icon={<UploadOutlined />}>Tải tệp lên</Button>
      )}
    </Upload>
  );
};
