import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, FileText, Download, Printer, Loader2, AlertCircle, 
  MapPin, Calendar, User as UserIcon
} from 'lucide-react';
import { useContract, useContractActions } from '../hooks/useContracts';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { renderAsync } from 'docx-preview';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Bản nháp', color: 'bg-slate-100 text-slate-600' },
  PENDING_SIGNATURE: { label: 'Chờ ký', color: 'bg-amber-100 text-amber-600' },
  PENDING_PAYMENT: { label: 'Chờ thanh toán', color: 'bg-blue-100 text-blue-600' },
  ACTIVE: { label: 'Hiệu lực', color: 'bg-emerald-100 text-emerald-600' },
  PENDING_TERMINATION: { label: 'Chờ thanh lý', color: 'bg-amber-100 text-amber-600' },
  EXPIRED: { label: 'Hết hạn', color: 'bg-rose-100 text-rose-600' },
  ENDED: { label: 'Đã kết thúc', color: 'bg-slate-100 text-slate-600' },
  TERMINATED: { label: 'Đã thanh lý', color: 'bg-indigo-100 text-indigo-600' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-400' },
};

export default function ContractDocumentViewPage() {
  const { propertyId, contractId } = useParams<{ propertyId: string; contractId: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading, error } = useContract(contractId);
  const { downloadDocument } = useContractActions();
  
  const [fileBlob, setFileBlob] = useState<Blob | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [docType, setDocType] = useState<'PDF' | 'DOCX' | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      if (!contractId || !contract) return;
      
      try {
        const blob = await downloadDocument.mutateAsync(contractId);
        setFileBlob(blob);
        
        const url = window.URL.createObjectURL(blob);
        setFileUrl(url);

        // Determine type
        if (contract.document_type) {
          setDocType(contract.document_type.toUpperCase() as 'PDF' | 'DOCX');
        } else if (blob.type === 'application/pdf') {
          setDocType('PDF');
        } else {
          setDocType('DOCX');
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        toast.error('Không thể tải tệp bản mềm hợp đồng.');
      }
    };

    if (contract) {
      fetchFile();
    }

    return () => {
      if (fileUrl) window.URL.revokeObjectURL(fileUrl);
    };
  }, [contractId, contract]);

  useEffect(() => {
    if (docType === 'DOCX' && fileBlob && fileUrl) {
      const container = document.getElementById('docx-container');
      if (container) {
        renderAsync(fileBlob, container);
      }
    }
  }, [docType, fileBlob, fileUrl]);

  const handleBack = () => {
    navigate(`/properties/${propertyId}/contracts/${contractId}`);
  };

  const handleDownload = () => {
    if (!fileUrl || !contract) return;
    const link = document.createElement('a');
    link.href = fileUrl;
    const extension = docType === 'PDF' ? 'pdf' : 'docx';
    link.download = `Hop-dong-${contract.room?.code || contract.id.substring(0, 8)}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="font-bold text-slate-500 animate-pulse">Đang tải tài liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
       <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase mb-2">Lỗi dữ liệu</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Không thể tìm thấy thông tin hợp đồng này.</p>
          <button onClick={handleBack} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">Quay lại</button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[contract.status as string] || STATUS_MAP.DRAFT;

  return (
    <div className="min-h-screen pb-10 transition-colors bg-white dark:bg-slate-950">
      {/* Container header matching project style */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <button 
              onClick={handleBack}
              className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-indigo-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                  Bản mềm Hợp đồng
                </h1>
                <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${statusInfo.color}`}>
                  {statusInfo.label}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-slate-500 dark:text-slate-400 text-sm font-medium">
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-lg">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  {contract.property?.name} • {contract.room?.code}
                </span>
                <span className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  {contract.start_date ? format(new Date(contract.start_date), 'dd/MM/yyyy') : 'N/A'} - {contract.end_date ? format(new Date(contract.end_date), 'dd/MM/yyyy') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={handleDownload}
              disabled={!fileUrl}
              className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              <span>Tải xuống</span>
            </button>
             <button 
              onClick={() => window.print()}
              disabled={!fileUrl}
              className="flex items-center justify-center p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              title="In hợp đồng"
            >
              <Printer className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Viewer Area */}
        <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[80vh] flex flex-col items-center justify-center">
          {!fileUrl ? (
            <div className="text-center p-10">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Đang chuẩn bị tệp xem trước...</p>
            </div>
          ) : docType === 'PDF' ? (
            <iframe 
              src={`${fileUrl}#toolbar=1`} 
              className="w-full h-full min-h-[80vh] border-none"
              title="Contract Document"
            />
          ) : (
            <div className="w-full bg-white dark:bg-slate-800 p-4 sm:p-8 flex justify-center overflow-auto min-h-[80vh]">
              <div id="docx-container" className="max-w-[850px] w-full shadow-lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
