import { useRef, useState } from 'react';
import { useUploadAvatar } from '../hooks/useProfile';
import { Camera, Loader2, User } from 'lucide-react';

interface AvatarUploaderProps {
  currentUrl: string | null;
  userName: string;
}

export default function AvatarUploader({ currentUrl, userName }: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const uploadAvatar = useUploadAvatar();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    uploadAvatar.mutate(file, {
      onSuccess: () => setPreview(null),
      onError: () => setPreview(null),
    });
  };

  const displayUrl = preview || currentUrl;
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-6">
      {/* Avatar Circle */}
      <div className="relative group">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-linear-to-br from-indigo-500 to-indigo-700 shadow-xl shadow-indigo-600/20 flex items-center justify-center">
          {displayUrl ? (
            <img src={displayUrl} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-black text-white">{initials || <User className="w-10 h-10" />}</span>
          )}
        </div>

        {/* Overlay */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAvatar.isPending}
          className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        >
          {uploadAvatar.isPending ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Info */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{userName}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          JPG, PNG hoặc WebP. Tối đa 2MB.
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAvatar.isPending}
          className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
        >
          Thay đổi ảnh đại diện
        </button>
      </div>
    </div>
  );
}
