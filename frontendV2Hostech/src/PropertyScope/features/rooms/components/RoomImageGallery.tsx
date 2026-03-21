import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';

interface RoomImageGalleryProps {
  roomId: string;
  images?: any[];
}

export default function RoomImageGallery({ roomId: _roomId, images = [] }: RoomImageGalleryProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Room Photos</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors border border-transparent dark:border-indigo-500/30">
          <Plus className="w-4 h-4" />
          Upload
        </button>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
              <img src={img.url || img.thumb_url} alt="Room" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="p-2 bg-white/20 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl text-center">
          <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300 dark:text-slate-500 border border-slate-100 dark:border-slate-700/50 shadow-sm">
            <ImageIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Photos</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
            Upload images to showcase this room's features.
          </p>
        </div>
      )}
    </div>
  );
}
