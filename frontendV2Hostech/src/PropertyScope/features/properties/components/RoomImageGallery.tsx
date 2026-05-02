import { Image as ImageIcon } from 'lucide-react';

interface RoomImageGalleryProps {
  roomId: string;
  images?: any[];
}

export default function RoomImageGallery({ roomId: _roomId, images = [] }: RoomImageGalleryProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black text-slate-900 dark:text-white">Room Photos</h3>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50"
            >
              <img src={img.url || img.thumb_url} alt="Room" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl text-center">
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 dark:text-slate-500 border border-slate-100 dark:border-slate-700/50 shadow-sm">
            <ImageIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Photos</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
            Chưa có hình ảnh hiển thị cho phòng này.
          </p>
        </div>
      )}
    </div>
  );
}
