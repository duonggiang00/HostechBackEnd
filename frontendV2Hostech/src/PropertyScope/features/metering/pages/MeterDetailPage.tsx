import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Check, X, Clock, Trash2, Edit2, Send, FileEdit, AlertTriangle, ImageIcon } from 'lucide-react';
import { meteringApi } from '../api/metering';
import { mediaApi } from '@/shared/features/media/api/media';
import MediaDropzone from '@/shared/features/media/components/MediaDropzone';
import type { Meter, MeterReading } from '../types';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
import RejectReasonModal from '../components/RejectReasonModal';
import toast from 'react-hot-toast';

export default function MeterDetailPage() {
  const { meterId } = useParams<{ meterId: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuthStore();

  const [meter, setMeter] = useState<Meter | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [readingsPage, setReadingsPage] = useState(1);
  const [totalReadings, setTotalReadings] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingReading, setEditingReading] = useState<MeterReading | null>(null);
  const [formData, setFormData] = useState({
    reading_value: '',
    period_start: '',
    period_end: '',
  });
  const [formError, setFormError] = useState<string>('');

  // Media upload state
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingReadingId, setRejectingReadingId] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    if (!meterId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const meterData = await meteringApi.getMeter(meterId);
        setMeter(meterData);

        // Fetch initial readings
        await _fetchReadings(meterId, 1);
      } catch (error: unknown) {
        console.error('Failed to fetch meter:', error);
        toast.error('Không thể tải thông tin đồng hồ');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [meterId]);

  const _fetchReadings = async (mId: string, page: number) => {
    try {
      setReadingsLoading(true);
      const response = await meteringApi.getMeterReadings(mId, page, 10);

      // Handle different response formats
      let readingsList: MeterReading[] = [];
      let total = 0;

      if (Array.isArray(response)) {
        readingsList = response;
        total = response.length;
      } else if (response?.data && Array.isArray(response.data)) {
        readingsList = response.data;
        total = response.meta?.total || response.data.length;
      } else if (response?.readings && Array.isArray(response.readings)) {
        readingsList = response.readings;
        total = response.readings.length;
      } else if (typeof response === 'object' && response !== null) {
        const dataField = Object.keys(response).find(key => Array.isArray(response[key as keyof typeof response]));
        if (dataField) {
          readingsList = response[dataField as keyof typeof response] as MeterReading[];
          total = readingsList.length;
        }
      }

      setReadings(readingsList);
      setTotalReadings(total);
      setReadingsPage(page);
    } catch (error: unknown) {
      console.error('Failed to fetch readings:', error);
      toast.error('Không thể tải lịch sử chốt số');
    } finally {
      setReadingsLoading(false);
    }
  };

  // ═══ Media Handlers ═══
  const handleMediaDrop = (files: File[]) => {
    setMediaFiles(prev => [...prev, ...files]);
    // Generate previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMediaFiles = async (): Promise<string[]> => {
    if (mediaFiles.length === 0) return [];
    setIsUploading(true);
    try {
      const uploadPromises = mediaFiles.map(file =>
        mediaApi.uploadFile(file, `meter-readings/${meterId}`)
      );
      const results = await Promise.all(uploadPromises);
      return results.map(r => r.id);
    } catch (err: any) {
      toast.error('Lỗi tải ảnh: ' + (err.message || 'Không xác định'));
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const resetMediaState = () => {
    setMediaFiles([]);
    setMediaPreviews([]);
  };

  const handleAddReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meterId) {
      setFormError('Meter ID không tìm thấy');
      return;
    }

    // Validation
    if (!formData.reading_value) { setFormError('Vui lòng nhập chỉ số'); return; }
    if (!formData.period_start) { setFormError('Từ ngày không được để trống'); return; }
    if (!formData.period_end) { setFormError('Vui lòng nhập đến ngày'); return; }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.period_start)) { setFormError(`Từ ngày phải có định dạng YYYY-MM-DD`); return; }
    if (!dateRegex.test(formData.period_end)) { setFormError(`Đến ngày phải có định dạng YYYY-MM-DD`); return; }
    if (new Date(formData.period_start) >= new Date(formData.period_end)) { setFormError('Từ ngày phải nhỏ hơn đến ngày'); return; }

    try {
      const readingValue = parseInt(formData.reading_value);
      if (isNaN(readingValue) || readingValue < 0) { setFormError('Chỉ số phải là số nguyên không âm'); return; }

      // Upload media first
      const proofMediaIds = await uploadMediaFiles();

      await meteringApi.createReading(meterId, {
        reading_value: readingValue,
        period_start: formData.period_start,
        period_end: formData.period_end,
        ...(proofMediaIds.length > 0 && { proof_media_ids: proofMediaIds }),
      });

      toast.success('Tạo nháp chốt số thành công');
      setFormData({ reading_value: '', period_start: '', period_end: '' });
      setFormError('');
      resetMediaState();
      setShowAddForm(false);
      await _fetchReadings(meterId, 1);
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error, 'Không thể thêm chốt số');
      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Get last reading date to auto-fill period_start
  const getLastReadingDate = (): string => {
    if (readings.length === 0) return '';
    const lastReading = readings[0]; // API returns sorted by -period_end
    return lastReading.period_end || '';
  };

  const handleOpenAddForm = () => {
    const lastReadingDate = getLastReadingDate();
    setFormData({ reading_value: '', period_start: lastReadingDate, period_end: '' });
    setFormError('');
    resetMediaState();
    setShowAddForm(true);
  };

  // ═══ Workflow Actions ═══

  const handleSubmitReading = async (readingId: string) => {
    if (!meterId) return;
    try {
      await meteringApi.submitReading(meterId, readingId);
      toast.success('Đã gửi duyệt chốt số');
      await _fetchReadings(meterId, readingsPage);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Không thể gửi duyệt'));
    }
  };

  const handleApproveReading = async (readingId: string) => {
    if (!meterId) return;
    try {
      await meteringApi.approveReading(meterId, readingId);
      toast.success('Duyệt chốt số thành công');
      await _fetchReadings(meterId, readingsPage);
      // Refresh meter to get updated base_reading
      const meterData = await meteringApi.getMeter(meterId);
      setMeter(meterData);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Không thể duyệt chốt số'));
    }
  };

  const handleOpenRejectModal = (readingId: string) => {
    setRejectingReadingId(readingId);
    setShowRejectModal(true);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!meterId || !rejectingReadingId) return;
    setIsRejecting(true);
    try {
      await meteringApi.rejectReading(meterId, rejectingReadingId, reason);
      toast.success('Từ chối chốt số thành công');
      setShowRejectModal(false);
      setRejectingReadingId(null);
      await _fetchReadings(meterId, readingsPage);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Không thể từ chối chốt số'));
    } finally {
      setIsRejecting(false);
    }
  };

  const handleOpenEditForm = (reading: MeterReading) => {
    setEditingReading(reading);
    setFormData({
      reading_value: reading.reading_value?.toString() || '',
      period_start: reading.period_start || '',
      period_end: reading.period_end || '',
    });
    setFormError('');
    resetMediaState();
    setShowEditForm(true);
  };

  const handleUpdateReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meterId || !editingReading) { setFormError('Không tìm thấy chốt số'); return; }

    if (!formData.reading_value) { setFormError('Vui lòng nhập chỉ số'); return; }
    if (!formData.period_start) { setFormError('Từ ngày không được để trống'); return; }
    if (!formData.period_end) { setFormError('Vui lòng nhập đến ngày'); return; }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.period_start)) { setFormError(`Từ ngày phải có định dạng YYYY-MM-DD`); return; }
    if (!dateRegex.test(formData.period_end)) { setFormError(`Đến ngày phải có định dạng YYYY-MM-DD`); return; }
    if (new Date(formData.period_start) >= new Date(formData.period_end)) { setFormError('Từ ngày phải nhỏ hơn đến ngày'); return; }

    try {
      const readingValue = parseInt(formData.reading_value);
      if (isNaN(readingValue) || readingValue < 0) { setFormError('Chỉ số phải là số nguyên không âm'); return; }

      // Upload media first
      setIsUploading(true);
      const proofMediaIds = await uploadMediaFiles();

      await meteringApi.updateReading(meterId, editingReading.id, {
        reading_value: readingValue,
        period_start: formData.period_start,
        period_end: formData.period_end,
        ...(proofMediaIds.length > 0 && { proof_media_ids: proofMediaIds }),
      });

      toast.success('Cập nhật chốt số thành công');
      setFormData({ reading_value: '', period_start: '', period_end: '' });
      setFormError('');
      resetMediaState();
      setShowEditForm(false);
      setEditingReading(null);
      await _fetchReadings(meterId, readingsPage);
    } catch (error: unknown) {
      const errorMessage = extractErrorMessage(error, 'Không thể cập nhật chốt số');
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteReading = async (readingId: string) => {
    if (!meterId) return;
    if (!confirm('Bạn có chắc chắn muốn xóa chốt số này?')) return;
    try {
      await meteringApi.deleteReading(meterId, readingId);
      toast.success('Xóa chốt số thành công');
      await _fetchReadings(meterId, readingsPage);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Không thể xóa chốt số'));
    }
  };

  // ═══ Permissions ═══
  const isStaff = hasRole(['Staff', 'Manager', 'Owner']);
  const canApproveReadings = hasRole(['Manager', 'Owner']);

  // ═══ Status helpers ═══
  const getStatusBadge = (reading: MeterReading) => {
    switch (reading.status) {
      case 'DRAFT':
        return (
          <div className="flex items-center gap-1.5" data-testid="reading-status-draft">
            <FileEdit className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Nháp</span>
          </div>
        );
      case 'SUBMITTED':
        return (
          <div className="flex items-center gap-1.5" data-testid="reading-status-submitted">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-500">Chờ duyệt</span>
          </div>
        );
      case 'APPROVED':
        return (
          <div className="flex items-center gap-1.5" data-testid="reading-status-approved">
            <Check className="w-4 h-4 text-green-600 dark:text-green-500" />
            <span className="text-sm font-semibold text-green-600 dark:text-green-500">Đã duyệt</span>
          </div>
        );
      case 'REJECTED':
        return (
          <div data-testid="reading-status-rejected">
            <div className="flex items-center gap-1.5">
              <X className="w-4 h-4 text-red-600 dark:text-red-500" />
              <span className="text-sm font-semibold text-red-600 dark:text-red-500">Từ chối</span>
            </div>
            {reading.rejection_reason && (
              <div className="mt-1 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 dark:text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-500 dark:text-red-400 italic line-clamp-2">{reading.rejection_reason}</p>
              </div>
            )}
          </div>
        );
      default:
        return <span className="text-sm text-slate-500">—</span>;
    }
  };

  const getReadingActions = (reading: MeterReading) => {
    const actions: React.ReactNode[] = [];

    // DRAFT: Staff can Edit, Submit, Delete
    if (reading.status === 'DRAFT' && isStaff) {
      actions.push(
        <button key="submit" onClick={() => handleSubmitReading(reading.id)}
          className="p-2 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg transition-colors" title="Gửi duyệt"
          data-testid="btn-submit-reading">
          <Send className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </button>
      );
      actions.push(
        <button key="edit" onClick={() => handleOpenEditForm(reading)}
          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="Sửa"
          data-testid="btn-edit-reading">
          <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>
      );
      actions.push(
        <button key="delete" onClick={() => handleDeleteReading(reading.id)}
          className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors" title="Xóa"
          data-testid="btn-delete-reading">
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      );
    }

    // SUBMITTED: Manager can Approve, Reject
    if (reading.status === 'SUBMITTED' && canApproveReadings) {
      actions.push(
        <button key="approve" onClick={() => handleApproveReading(reading.id)}
          className="p-2 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg transition-colors" title="Duyệt"
          data-testid="btn-approve-reading">
          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
        </button>
      );
      actions.push(
        <button key="reject" onClick={() => handleOpenRejectModal(reading.id)}
          className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors" title="Từ chối"
          data-testid="btn-reject-reading">
          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      );
    }

    // REJECTED: Staff can Edit, Re-submit, Delete
    if (reading.status === 'REJECTED' && isStaff) {
      actions.push(
        <button key="resubmit" onClick={() => handleSubmitReading(reading.id)}
          className="p-2 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-lg transition-colors" title="Gửi lại"
          data-testid="btn-resubmit-reading">
          <Send className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </button>
      );
      actions.push(
        <button key="edit" onClick={() => handleOpenEditForm(reading)}
          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors" title="Sửa"
          data-testid="btn-edit-reading">
          <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </button>
      );
      actions.push(
        <button key="delete" onClick={() => handleDeleteReading(reading.id)}
          className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors" title="Xóa"
          data-testid="btn-delete-reading">
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      );
    }

    // APPROVED: No actions (use Adjustment Notes for corrections)

    return actions;
  };

  // ═══ Helpers ═══
  function extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null) {
      const err = error as Record<string, unknown>;
      const response = err.response as Record<string, unknown> | undefined;
      const data = response?.data as Record<string, unknown> | undefined;
      if (data?.errors && typeof data.errors === 'object') {
        return (Object.values(data.errors).flat() as string[]).join(', ');
      }
      if (data?.message) return data.message as string;
      if (err.message) return err.message as string;
    }
    return fallback;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (!meter) {
    return (
      <div className="p-6">
        <p className="text-red-600 dark:text-red-400">Không tìm thấy đồng hồ</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalReadings / 10);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors" data-testid="meter-detail-title">Chi tiết đồng hồ</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Meter Info Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Mã đồng hồ</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{meter.code}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Loại</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
                {meter.type === 'ELECTRIC' ? '⚡ Điện' : '💧 Nước'}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Trạng thái</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${meter.is_active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                <span className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                  {meter.is_active ? 'Hoạt động' : 'Ngưng hoạt động'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Loại đồng hồ</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                {meter.is_master ? '👑 Master' : 'Thường'}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Chỉ số cơ sở</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
                {meter.base_reading?.toLocaleString('vi-VN') || '0'}
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                  {meter.type === 'ELECTRIC' ? 'kWh' : 'm³'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Phòng</p>
              {meter.room ? (
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">{meter.room.code}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors">{meter.room.name}</p>
                </div>
              ) : (
                <p className="text-slate-400 dark:text-slate-500">-</p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Ngày cài đặt</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                {meter.installed_at ? new Date(meter.installed_at).toLocaleDateString('vi-VN') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Tòa nhà</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                {meter.room?.property?.name || meter.property_id?.slice(0, 8)}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Ngày tạo</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                {meter.created_at ? new Date(meter.created_at).toLocaleDateString('vi-VN') : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Readings Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors" data-testid="readings-history-title">Lịch sử chốt số</h2>
              <button
                onClick={() => showAddForm ? setShowAddForm(false) : handleOpenAddForm()}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                data-testid="btn-add-reading"
              >
              <Plus className="w-5 h-5" />
              Thêm chốt số mới
            </button>
          </div>

          {/* Add Reading Form */}
          {showAddForm && (
            <form onSubmit={handleAddReading} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6 transition-colors">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4" data-testid="add-reading-form-title">Thêm chốt số mới (Nháp)</h3>

              {formError && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Chỉ số <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.reading_value}
                    onChange={(e) => setFormData({ ...formData, reading_value: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                    placeholder="0"
                    data-testid="input-reading-value"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Từ ngày <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.period_start}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-600 dark:text-slate-400 transition-colors"
                    title="Tự động lấy ngày kết thúc của lần chốt gần nhất"
                    data-testid="input-period-start"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {formData.period_start ? 'Tự động lấy từ lần chốt gần nhất' : 'Sẽ được tự động điền từ lần chốt trước'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    Đến ngày <span className="text-red-600 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                    data-testid="input-period-end"
                  />
                </div>
              </div>

              {/* Dynamic Usage Calculation Preview */}
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Chỉ số cũ</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {readings.length > 0 ? readings[0].reading_value?.toLocaleString('vi-VN') : (meter.base_reading?.toLocaleString('vi-VN') || '0')}
                    </p>
                  </div>
                  <div className="text-slate-300 dark:text-slate-600 hidden sm:block">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Chỉ số mới</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {formData.reading_value || '0'}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Mức sử dụng dự kiến</p>
                    <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {(() => {
                        const current = parseInt(formData.reading_value) || 0;
                        const previous = readings.length > 0 ? (readings[0].reading_value || 0) : (meter.base_reading || 0);
                        const diff = current - previous;
                        return (diff > 0 ? `+${diff.toLocaleString('vi-VN')}` : diff.toLocaleString('vi-VN')) + (meter.type === 'ELECTRIC' ? ' kWh' : ' m³');
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Ảnh minh chứng (tuỳ chọn)
                </label>
                <MediaDropzone
                  onDrop={handleMediaDrop}
                  maxFiles={5}
                  accept="image/*"
                  isUploading={isUploading}
                />
                {mediaPreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {mediaPreviews.map((preview, index) => (
                      <div key={index} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(index)}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                  data-testid="btn-save-draft">
                  {isUploading ? 'Đang tải ảnh...' : 'Lưu nháp'}
                </button>
                <button type="button"
                  onClick={() => { setShowAddForm(false); setFormError(''); }}
                  className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* Readings Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
            {readingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
              </div>
            ) : readings.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-slate-600 dark:text-slate-400">Chưa có lịch sử chốt số</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 transition-colors">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Thời gian</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Chỉ số</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Mức sử dụng</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Trạng thái</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {readings.map((reading) => (
                        <tr key={reading.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" data-testid={`reading-row-${reading.id}`}>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                                {reading.period_start && reading.period_end
                                  ? `${new Date(reading.period_start).toLocaleDateString('vi-VN')} - ${new Date(reading.period_end).toLocaleDateString('vi-VN')}`
                                  : '-'}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">
                                {reading.submitted_at
                                  ? `Chốt: ${new Date(reading.submitted_at).toLocaleDateString('vi-VN')}`
                                  : reading.created_at
                                  ? `Tạo: ${new Date(reading.created_at).toLocaleDateString('vi-VN')}`
                                  : '-'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="font-bold text-slate-900 dark:text-white transition-colors">
                              {reading.reading_value?.toLocaleString('vi-VN') || '0'}
                            </p>
                            {reading.proofs && reading.proofs.length > 0 && (
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <ImageIcon className="w-3 h-3 text-indigo-500" />
                                <span className="text-xs text-indigo-500 font-medium">{reading.proofs.length} ảnh</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                              reading.status === 'APPROVED'
                                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                              {reading.consumption !== undefined
                                ? `+${reading.consumption.toLocaleString('vi-VN')} ${meter.type === 'ELECTRIC' ? 'kWh' : 'm³'}`
                                : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(reading)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-1 justify-end">
                              {getReadingActions(reading)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 transition-colors">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Trang {readingsPage}/{totalPages} - Tổng: {totalReadings} chốt số
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => meterId && _fetchReadings(meterId, Math.max(1, readingsPage - 1))}
                        disabled={readingsPage === 1}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        ◀
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => meterId && _fetchReadings(meterId, p)}
                          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                            readingsPage === p
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => meterId && _fetchReadings(meterId, Math.min(totalPages, readingsPage + 1))}
                        disabled={readingsPage === totalPages}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Edit Modal */}
          {showEditForm && editingReading && (
            <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-white dark:bg-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Sửa chốt số</h3>
                  <button
                    onClick={() => { setShowEditForm(false); setEditingReading(null); setFormError(''); }}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpdateReading} className="p-6 space-y-4">
                  {formError && (
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">{formError}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Chỉ số <span className="text-red-600 dark:text-red-400">*</span>
                    </label>
                    <input type="number" value={formData.reading_value}
                      onChange={(e) => setFormData({ ...formData, reading_value: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="0" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Từ ngày <span className="text-red-600 dark:text-red-400">*</span>
                    </label>
                    <input type="date" value={formData.period_start}
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Đến ngày <span className="text-red-600 dark:text-red-400">*</span>
                    </label>
                    <input type="date" value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                  </div>

                  {/* Media Dropzone */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                      Ảnh chụp/Minh chứng
                    </label>
                    <div className="bg-slate-50 dark:bg-slate-900/50 border-dashed border-2 rounded-xl">
                      <MediaDropzone
                        onDrop={handleMediaDrop}
                        maxFiles={5}
                      />
                    </div>
                    
                    {/* Media Previews */}
                    {mediaPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {mediaPreviews.map((preview, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-900">
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(idx)}
                              className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-800 pb-2">
                    <button type="submit"
                      disabled={isUploading}
                      className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                      {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isUploading ? 'Đang tải ảnh...' : 'Cập nhật'}
                    </button>
                    <button type="button"
                      onClick={() => { setShowEditForm(false); setEditingReading(null); setFormError(''); }}
                      className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex-1">
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      <RejectReasonModal
        isOpen={showRejectModal}
        onClose={() => { setShowRejectModal(false); setRejectingReadingId(null); }}
        onConfirm={handleConfirmReject}
        isLoading={isRejecting}
      />
    </div>
  );
}
