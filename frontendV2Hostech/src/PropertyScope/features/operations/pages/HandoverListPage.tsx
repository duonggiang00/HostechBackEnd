import HandoverListing from '../components/HandoverListing';
import { ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Vỏ trang giống ContractListPage: nền xám, header trắng, vùng nội dung có max-width.
 */
export default function HandoverListPage() {
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="px-6 lg:px-8 py-5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 shadow-sm relative z-20 transition-colors">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center shadow-sm">
                <ClipboardCheck className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-gray-900 dark:text-white text-[20px] font-bold tracking-tight">
                Biên bản bàn giao phòng
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-[12px] font-medium tracking-wide ml-11">
              Danh sách biên bản theo tòa — bấm chi tiết để xem đầy đủ tài sản, chỉ số, chứng từ
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar px-6 lg:px-8 pb-8">
        <div className="max-w-[1600px] mx-auto py-10">
          <HandoverListing />
        </div>
      </div>
    </div>
  );
}
