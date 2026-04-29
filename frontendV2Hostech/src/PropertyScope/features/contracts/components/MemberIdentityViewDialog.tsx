import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  memberName: string;
  frontUrl: string | null | undefined;
  backUrl: string | null | undefined;
};

export function MemberIdentityViewDialog({ open, onClose, memberName, frontUrl, backUrl }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-label="Đóng"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">CCCD / CMND</h2>
                <p className="text-xs font-medium text-slate-500">{memberName}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Mặt trước</p>
                {frontUrl ? (
                  <img src={frontUrl} alt="CCCD mặt trước" className="max-h-[55vh] w-full rounded-xl border border-slate-200 object-contain dark:border-slate-700" />
                ) : (
                  <p className="text-sm text-slate-400">Chưa có ảnh.</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-400">Mặt sau</p>
                {backUrl ? (
                  <img src={backUrl} alt="CCCD mặt sau" className="max-h-[55vh] w-full rounded-xl border border-slate-200 object-contain dark:border-slate-700" />
                ) : (
                  <p className="text-sm text-slate-400">Chưa có ảnh.</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
