import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Check, X, Clock, Trash2, Edit2, SendHorizontal, Eye } from 'lucide-react';
import { meteringApi } from '../api/metering';
import type { Meter, MeterReading } from '../types';
import { useAuthStore } from '@/shared/features/auth/stores/useAuthStore';
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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [selectedProofPreviewUrl, setSelectedProofPreviewUrl] = useState<string | null>(null);
  const [isAddingReading, setIsAddingReading] = useState(false);
  const proofInputRef = useRef<HTMLInputElement | null>(null);

  // State riêng cho ảnh trong edit modal
  const [editProofFile, setEditProofFile] = useState<File | null>(null);
  const [editProofPreviewUrl, setEditProofPreviewUrl] = useState<string | null>(null);
  const editProofInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_PROOF_IMAGE_SIZE_MB = 5;
  const MAX_PROOF_IMAGE_SIZE = MAX_PROOF_IMAGE_SIZE_MB * 1024 * 1024;

  // Tạo/huỷ preview URL cho ảnh chứng minh mới (add form)
  useEffect(() => {
    if (!proofFile) {
      setSelectedProofPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(proofFile);
    setSelectedProofPreviewUrl(objectUrl);
    return () => { URL.revokeObjectURL(objectUrl); };
  }, [proofFile]);

  // Tạo/huỷ preview URL cho ảnh chứng minh trong edit modal
  useEffect(() => {
    if (!editProofFile) {
      setEditProofPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(editProofFile);
    setEditProofPreviewUrl(objectUrl);
    return () => { URL.revokeObjectURL(objectUrl); };
  }, [editProofFile]);

  const clearProofSelection = () => {
    setProofFile(null);
    if (proofInputRef.current) proofInputRef.current.value = '';
  };

  const clearEditProofSelection = () => {
    setEditProofFile(null);
    if (editProofInputRef.current) editProofInputRef.current.value = '';
  };

  // Xử lý chọn ảnh trong edit modal
  const handleEditProofFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) { clearEditProofSelection(); return; }
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh (jpg, png, webp, ...).');
      event.target.value = '';
      clearEditProofSelection();
      return;
    }
    if (file.size > MAX_PROOF_IMAGE_SIZE) {
      toast.error(`Ảnh vượt quá ${MAX_PROOF_IMAGE_SIZE_MB}MB. Vui lòng chọn ảnh nhỏ hơn.`);
      event.target.value = '';
      clearEditProofSelection();
      return;
    }
    setEditProofFile(file);
  };

  const handleProofFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      clearProofSelection();
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh (jpg, png, webp, ...).');
      event.target.value = '';
      clearProofSelection();
      return;
    }

    if (file.size > MAX_PROOF_IMAGE_SIZE) {
      toast.error(`Ảnh vượt quá ${MAX_PROOF_IMAGE_SIZE_MB}MB. Vui lòng chọn ảnh nhỏ hơn.`);
      event.target.value = '';
      clearProofSelection();
      return;
    }

    setProofFile(file);
  };

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

      console.log('📊 Readings response:', response);

      // Xử lý nhiều format response từ API
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

      // Normalise: backend có thể trả về 'media' thay vì 'proofs'
      readingsList = readingsList.map(r => ({
        ...r,
        proofs: r.proofs ?? (r as any).media ?? [],
      }));

      console.log('✅ Processed readings:', readingsList.length, 'Total:', total);
      setReadings(readingsList);
      setTotalReadings(total);
      setReadingsPage(page);
    } catch (error: unknown) {
      console.error('❌ Failed to fetch readings:', error);
      toast.error('Không thể tải lịch sử chốt số');
    } finally {
      setReadingsLoading(false);
    }
  };

  const handleAddReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingReading) {
      return;
    }

    if (!meterId) {
      setFormError('Meter ID không tìm thấy');
      return;
    }

    // Validation
    if (!formData.reading_value) {
      setFormError('Vui lòng nhập chỉ số');
      return;
    }

    if (!formData.period_start) {
      setFormError('Từ ngày không được để trống');
      return;
    }

    if (!formData.period_end) {
      setFormError('Vui lòng nhập đến ngày');
      return;
    }

    // Check date format (must be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.period_start)) {
      setFormError(`Từ ngày phải có định dạng YYYY-MM-DD (hiện tại: ${formData.period_start})`);
      return;
    }

    if (!dateRegex.test(formData.period_end)) {
      setFormError(`Đến ngày phải có định dạng YYYY-MM-DD (hiện tại: ${formData.period_end})`);
      return;
    }

    if (new Date(formData.period_start) >= new Date(formData.period_end)) {
      setFormError('Từ ngày phải nhỏ hơn đến ngày');
      return;
    }

    const readingValue = parseInt(formData.reading_value);
    if (isNaN(readingValue)) {
      setFormError('Chỉ số phải là số nguyên');
      return;
    }

    if (readingValue < 0) {
      setFormError('Chỉ số không được âm');
      return;
    }

    // Monotonic check: Cannot be smaller than latest reading
    const prevValue = meter?.latest_reading ?? meter?.base_reading ?? 0;
    if (readingValue < prevValue) {
      setFormError(`Chỉ số mới (${readingValue}) không thể nhỏ hơn chỉ số cũ (${prevValue})`);
      return;
    }

    try {
      setIsAddingReading(true);
      const readingValue = parseInt(formData.reading_value);

      console.log('📝 Creating reading:', {
        meter_id: meterId,
        reading_value: readingValue,
        period_start: formData.period_start,
        period_end: formData.period_end,
      });

      let proofMediaIds: string[] = [];
      if (proofFile) {
        const uploadResult = await meteringApi.uploadReadingProof(proofFile);
        proofMediaIds = [uploadResult.temporary_upload_id];
      }

      const result = await meteringApi.createReading(meterId, {
        reading_value: readingValue,
        period_start: formData.period_start,
        period_end: formData.period_end,
        ...(proofMediaIds.length > 0 ? { proof_media_ids: proofMediaIds } : {}),
      });

      console.log('✅ Reading created:', result);
      toast.success('Thêm chốt số thành công');
      setFormData({ reading_value: '', period_start: '', period_end: '' });
      setFormError('');
      clearProofSelection();
      setShowAddForm(false);
      if (meterId) {
        await _fetchReadings(meterId, 1);
      }
    } catch (error: unknown) {
      console.error('❌ Failed to add reading:', error);
      let errorMessage = 'Không thể thêm chốt số';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;
        console.error('🔍 Full error object:', JSON.stringify(err, null, 2));
        const response = err.response as Record<string, unknown> | undefined;
        const data = response?.data as Record<string, unknown> | undefined;

        console.error('Response data:', data);

        // Try to get error message from validation errors
        if (data?.errors && typeof data.errors === 'object') {
          const errorList = Object.values(data.errors).flat() as string[];
          errorMessage = errorList.join(', ');
          console.error('Validation errors:', errorList);
        } else if (data?.message) {
          errorMessage = data.message as string;
        } else {
          errorMessage = (err.message as string) || errorMessage;
        }
      }

      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAddingReading(false);
    }
  };

  // Get last reading date to auto-fill period_start
  const getLastReadingDate = (): string => {
    if (readings.length === 0) {
      return '';
    }
    const lastReading = readings[0]; // API returns sorted by -period_end
    if (lastReading.period_end) {
      return lastReading.period_end; // Return as YYYY-MM-DD
    }
    return '';
  };

  // Auto-fill period_start when opening form
  const handleOpenAddForm = () => {
    const lastReadingDate = getLastReadingDate();
    setFormData({
      reading_value: '',
      period_start: lastReadingDate,
      period_end: '',
    });
    clearProofSelection();
    setFormError('');
    setShowAddForm(true);
  };

  const handleApproveReading = async (readingId: string) => {
    if (!meterId) return;

    try {
      await meteringApi.approveReading(meterId, readingId);
      toast.success('Duyệt chốt số thành công');
      await _fetchReadings(meterId, readingsPage);
    } catch (error: unknown) {
      console.error('Failed to approve:', error);
      toast.error('Không thể duyệt chốt số');
    }
  };

  const handleSubmitReading = async (readingId: string) => {
    if (!meterId) return;

    try {
      await meteringApi.submitReading(meterId, readingId);
      toast.success('Đã gửi duyệt cho quản lý');
      await _fetchReadings(meterId, readingsPage);
    } catch (error: unknown) {
      console.error('Failed to submit reading:', error);
      toast.error('Không thể gửi duyệt chốt số');
    }
  };

  const handleRejectReading = async (readingId: string) => {
    if (!meterId) return;

    try {
      await meteringApi.rejectReading(meterId, readingId, 'Từ chối');
      toast.success('Từ chối chốt số thành công');
      await _fetchReadings(meterId, readingsPage);
    } catch (error: unknown) {
      console.error('Failed to reject:', error);
      toast.error('Không thể từ chối chốt số');
    }
  };

  const handleOpenEditForm = async (reading: MeterReading) => {
    if (!meterId) return;

    try {
      // Lấy chi tiết mới nhất để chắc chắn có proofs (ảnh) cho modal edit
      const fresh = await meteringApi.getMeterReading(meterId, reading.id);
      const merged = {
        ...reading,
        ...fresh,
        proofs: (fresh as any)?.proofs ?? (fresh as any)?.media ?? reading.proofs ?? [],
      } as MeterReading;

      setEditingReading(merged);
      setFormData({
        reading_value: merged.reading_value?.toString() || '',
        period_start: merged.period_start || '',
        period_end: merged.period_end || '',
      });

      // Cập nhật danh sách để cột "Ảnh" hiển thị ngay sau khi mở modal
      setReadings(prev => prev.map(r => (r.id === merged.id ? merged : r)));
    } catch (error) {
      console.error('❌ Failed to fetch reading detail for edit:', error);
      // Fallback dùng data hiện tại nếu call detail lỗi
      setEditingReading(reading);
      setFormData({
        reading_value: reading.reading_value?.toString() || '',
        period_start: reading.period_start || '',
        period_end: reading.period_end || '',
      });
    }

    // Reset ảnh edit mỗi lần mở modal
    clearEditProofSelection();
    setFormError('');
    setShowEditForm(true);
  };

  const handleUpdateReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meterId || !editingReading) {
      setFormError('Không tìm thấy chốt số');
      return;
    }

    // Validation
    if (!formData.reading_value) {
      setFormError('Vui lòng nhập chỉ số');
      return;
    }

    if (!formData.period_start) {
      setFormError('Từ ngày không được để trống');
      return;
    }

    if (!formData.period_end) {
      setFormError('Vui lòng nhập đến ngày');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.period_start)) {
      setFormError(`Từ ngày phải có định dạng YYYY-MM-DD (hiện tại: ${formData.period_start})`);
      return;
    }

    if (!dateRegex.test(formData.period_end)) {
      setFormError(`Đến ngày phải có định dạng YYYY-MM-DD (hiện tại: ${formData.period_end})`);
      return;
    }

    if (new Date(formData.period_start) >= new Date(formData.period_end)) {
      setFormError('Từ ngày phải nhỏ hơn đến ngày');
      return;
    }

    try {
      const readingValue = parseInt(formData.reading_value);
      if (isNaN(readingValue)) {
        setFormError('Chỉ số phải là số nguyên');
        return;
      }

      if (readingValue < 0) {
        setFormError('Chỉ số không được âm');
        return;
      }

      // Check monotonicity against previous/next reading if available
      const currentIndex = readings.findIndex(r => r.id === editingReading.id);
      if (currentIndex !== -1) {
        // Readings are sorted by period_end desc in the list
        if (currentIndex < readings.length - 1) {
          const prevReading = readings[currentIndex + 1];
          if (readingValue < prevReading.reading_value) {
            setFormError(`Chỉ số mới (${readingValue}) không thể nhỏ hơn chỉ số cũ (${prevReading.reading_value})`);
            return;
          }
        }
        if (currentIndex > 0) {
          const nextReading = readings[currentIndex - 1];
          if (readingValue > nextReading.reading_value) {
            setFormError(`Chỉ số mới (${readingValue}) không thể lớn hơn chỉ số của kỳ kế tiếp (${nextReading.reading_value})`);
            return;
          }
        }
      }

      console.log('📝 Updating reading:', {
        reading_id: editingReading.id,
        reading_value: readingValue,
        period_start: formData.period_start,
        period_end: formData.period_end,
      });

      // Upload ảnh mới nếu người dùng chọn thay đổi; nếu không chọn thì giữ nguyên ảnh cũ (không gửi proof_media_ids)
      let proofMediaIds: string[] | undefined;
      if (editProofFile) {
        const uploadResult = await meteringApi.uploadReadingProof(editProofFile);
        proofMediaIds = [uploadResult.temporary_upload_id];
      }

      await meteringApi.updateReading(meterId, editingReading.id, {
        reading_value: readingValue,
        period_start: formData.period_start,
        period_end: formData.period_end,
        ...(proofMediaIds ? { proof_media_ids: proofMediaIds } : {}),
      });

      console.log('✅ Reading updated');
      toast.success('Cập nhật chốt số thành công');
      setFormData({ reading_value: '', period_start: '', period_end: '' });
      setFormError('');
      clearEditProofSelection();
      setShowEditForm(false);
      setEditingReading(null);
      if (meterId) {
        await _fetchReadings(meterId, readingsPage);
      }
    } catch (error: unknown) {
      console.error('❌ Failed to update reading:', error);
      let errorMessage = 'Không thể cập nhật chốt số';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;
        console.error('🔍 Full error object:', JSON.stringify(err, null, 2));
        const response = err.response as Record<string, unknown> | undefined;
        const data = response?.data as Record<string, unknown> | undefined;

        if (data?.errors && typeof data.errors === 'object') {
          const errorList = Object.values(data.errors).flat() as string[];
          errorMessage = errorList.join(', ');
        } else if (data?.message) {
          errorMessage = data.message as string;
        }
      }

      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeleteReading = async (readingId: string) => {
    if (!meterId) return;

    if (!confirm('Bạn có chắc chắn muốn xóa chốt số này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      await meteringApi.deleteReading(meterId, readingId);
      toast.success('Xóa chốt số thành công');
      await _fetchReadings(meterId, readingsPage);
    } catch (error: unknown) {
      console.error('Failed to delete:', error);

      let errorMessage = 'Không thể xóa chốt số';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;
        const response = err.response as Record<string, unknown> | undefined;
        const data = response?.data as Record<string, unknown> | undefined;
        if (data?.message) {
          errorMessage = data.message as string;
        }
      }

      toast.error(errorMessage);
    }
  };

  // Manager/Owner full control, Staff can thao tác cho luồng nháp.
  const canManageReadings = hasRole(['Manager', 'Owner', 'Staff']);
  const canSubmitDraftReadings = hasRole(['Manager', 'Owner', 'Staff']);

  // Check if user can approve readings (duyệt/từ chối) - Only Manager and Owner
  const canApproveReadings = hasRole(['Manager', 'Owner']);

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
            className="flex items-center gap-2 text-[#1E3A8A] hover:text-blue-900 transition-colors mb-4 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Chi tiết đồng hồ</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Meter Info Card */}
        <div className="bg-white dark:bg-slate-800 rounded-[12px] shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Code */}
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Mã đồng hồ
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{meter.code}</p>
            </div>

            {/* Type */}
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Loại
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
                {meter.type === 'ELECTRIC' ? '⚡ Điện' : '💧 Nước'}
              </p>
            </div>

            {/* Status */}
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Trạng thái
              </p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${meter.is_active ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                <span className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                  {meter.is_active ? 'Hoạt động' : 'Ngưng hoạt động'}
                </span>
              </div>
            </div>

            {/* Master */}
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Loại đồng hồ
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                {meter.is_master ? '👑 Master' : 'Thường'}
              </p>
            </div>

            {/* Base Reading */}
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Chỉ số cơ sở
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
                {meter.base_reading?.toLocaleString('vi-VN') || '0'}
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                  {meter.type === 'ELECTRIC' ? 'kWh' : 'm³'}
                </span>
              </p>
            </div>

            {/* Latest Reading */}
            <div>
              <p className="text-sm font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-2">
                Chỉ số hiện tại
              </p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 transition-colors">
                {(meter.latest_reading ?? meter.base_reading)?.toLocaleString('vi-VN') || '0'}
                <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">
                  {meter.type === 'ELECTRIC' ? 'kWh' : 'm³'}
                </span>
              </p>
            </div>

            {/* Room */}
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Phòng
              </p>
              {meter.room ? (
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">{meter.room.code}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors">{meter.room.name}</p>
                </div>
              ) : (
                <p className="text-slate-400 dark:text-slate-500">-</p>
              )}
            </div>

            {/* Installed At */}
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Ngày cài đặt
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                {meter.installed_at ? new Date(meter.installed_at).toLocaleDateString('vi-VN') : '-'}
              </p>
            </div>

            {/* Property */}
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Tòa nhà
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                {meter.room?.property?.name || meter.property_id?.slice(0, 8)}
              </p>
            </div>

            {/* Created */}
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                Ngày tạo
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                {meter.created_at ? new Date(meter.created_at).toLocaleDateString('vi-VN') : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Readings Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white transition-colors">Lịch sử chốt số</h2>
            <button
              onClick={() => showAddForm ? setShowAddForm(false) : handleOpenAddForm()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F59E0B] text-white font-semibold rounded-[8px] text-sm hover:bg-[#D97706] transition-colors shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Thêm chốt số mới
            </button>
          </div>

          {/* Add Reading Form */}
          {showAddForm && (
            <form onSubmit={handleAddReading} className="bg-white dark:bg-slate-800 rounded-[12px] shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6 transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Thêm chốt số mới</h3>

              {formError && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Chỉ số <span className="text-red-600 dark:text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.reading_value}
                      onChange={(e) => setFormData({ ...formData, reading_value: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors font-mono text-lg font-bold"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
                      Tiêu thụ dự kiến
                    </label>
                    <div className="h-[46px] flex items-center px-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className={`text-lg font-black ${
                        formData.reading_value && parseInt(formData.reading_value) >= (meter.latest_reading ?? meter.base_reading)
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-300'
                      }`}>
                        {formData.reading_value 
                          ? Math.max(0, parseInt(formData.reading_value) - (meter.latest_reading ?? meter.base_reading)).toLocaleString()
                          : '0'
                        }
                      </span>
                      <span className="ml-2 text-xs text-slate-500 font-medium">
                        {meter.type === 'ELECTRIC' ? 'kWh' : 'm³'}
                      </span>
                    </div>
                  </div>
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
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Ảnh chứng minh đồng hồ</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={proofInputRef}
                  onChange={handleProofFileChange}
                  className="w-full text-sm text-slate-700 dark:text-slate-300 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-500/20 dark:file:text-indigo-300"
                />
                {proofFile ? (
                  <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                    <div className="flex items-start gap-3">
                      {selectedProofPreviewUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewImageUrl(selectedProofPreviewUrl)}
                          className="h-20 w-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                          title="Xem ảnh đã chọn"
                        >
                          <img src={selectedProofPreviewUrl} alt="Ảnh đã chọn" className="h-full w-full object-cover" />
                        </button>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-600 dark:text-slate-300 truncate" title={proofFile.name}>
                          Đã chọn: {proofFile.name}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          {(proofFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={clearProofSelection}
                          className="mt-2 inline-flex items-center rounded-md border border-red-200 dark:border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          Xóa ảnh đã chọn
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Bạn có thể chụp ảnh công tơ để lưu bằng chứng.</p>
                )}
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

              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={isAddingReading}
                  className="px-6 py-2.5 bg-[#1E3A8A] text-white font-semibold rounded-[8px] hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm inline-flex items-center gap-2 text-sm"
                >
                  {isAddingReading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isAddingReading ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormError('');
                    clearProofSelection();
                  }}
                  className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold rounded-[8px] hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* Readings Table */}
          <div className="bg-white dark:bg-slate-800 rounded-[12px] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors text-sm">
            {readingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#1E3A8A] dark:text-blue-400" />
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
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Thời gian</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300 text-right">Chỉ số</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300 text-right">Mức sử sử dụng</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Ảnh</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-300">Trạng thái</th>
                        <th className="px-6 py-3 text-right font-semibold text-slate-900 dark:text-slate-300">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {readings.map((reading) => (
                        <tr key={reading.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
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
                                  : '-'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="font-bold text-slate-900 dark:text-white transition-colors">
                              {reading.reading_value?.toLocaleString('vi-VN') || '0'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                              {reading.consumption !== undefined
                                ? `+${reading.consumption.toLocaleString('vi-VN')} ${meter.type === 'ELECTRIC' ? 'kWh' : 'm³'}`
                                : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {reading.proofs && reading.proofs.length > 0 ? (
                              <button
                                onClick={() => setPreviewImageUrl(reading.proofs?.[0]?.url || null)}
                                className="relative h-12 w-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 group"
                                title="Xem ảnh chốt số"
                              >
                                <img
                                  src={reading.proofs[0].thumb_url || reading.proofs[0].url}
                                  alt="Ảnh chứng minh"
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40 text-white text-xs font-semibold">
                                  <Eye className="w-3 h-3 mr-1" /> Xem
                                </span>
                              </button>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 text-sm">Không có</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {reading.status === 'APPROVED' && (
                                <>
                                  <Check className="w-4 h-4 text-green-600 dark:text-green-500" />
                                  <span className="text-sm font-semibold text-green-600 dark:text-green-500">Đã duyệt</span>
                                </>
                              )}
                              {reading.status === 'SUBMITTED' && (
                                <>
                                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                                  <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-500">Chờ duyệt</span>
                                </>
                              )}
                              {reading.status === 'DRAFT' && (
                                <>
                                  <Edit2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Nháp</span>
                                </>
                              )}
                              {reading.status === 'REJECTED' && (
                                <>
                                  <X className="w-4 h-4 text-red-600 dark:text-red-500" />
                                  <span className="text-sm font-semibold text-red-600 dark:text-red-500">Từ chối</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {/* Submit for manager review */}
                              {reading.status === 'DRAFT' && canSubmitDraftReadings && (
                                <button
                                  onClick={() => handleSubmitReading(reading.id)}
                                  className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                                  title="Gửi duyệt"
                                >
                                  <SendHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </button>
                              )}

                              {/* Approve/Reject for SUBMITTED readings - Only Manager can do this */}
                              {reading.status === 'SUBMITTED' && canApproveReadings && (
                                <>
                                  <button
                                    onClick={() => handleApproveReading(reading.id)}
                                    className="p-2 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-lg transition-colors"
                                    title="Duyệt"
                                  >
                                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  </button>
                                  <button
                                    onClick={() => handleRejectReading(reading.id)}
                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                    title="Từ chối"
                                  >
                                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  </button>
                                </>
                              )}

                              {/* Edit only for DRAFT */}
                              {reading.status === 'DRAFT' && canManageReadings && (
                                <button
                                  onClick={() => handleOpenEditForm(reading)}
                                  className="p-2 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                                  title="Sửa"
                                >
                                  <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </button>
                              )}

                              {/* Delete - Available for all readings and users who manage */}
                              {canManageReadings && (
                                <button
                                  onClick={() => handleDeleteReading(reading.id)}
                                  className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </button>
                              )}
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
                          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${readingsPage === p
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg max-w-lg w-full max-h-96 overflow-y-auto">
                <div className="sticky top-0 border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-white dark:bg-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Sửa chốt số</h3>
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingReading(null);
                      setFormError('');
                    }}
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
                    <input
                      type="number"
                      value={formData.reading_value}
                      onChange={(e) => setFormData({ ...formData, reading_value: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Từ ngày <span className="text-red-600 dark:text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.period_start}
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Đến ngày <span className="text-red-600 dark:text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {/* Ảnh chứng minh - hiện ảnh cũ + cho phép thay ảnh mới */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Ảnh chứng minh</label>

                    {/* Ảnh hiện tại (nếu có và chưa chọn ảnh mới) */}
                    {!editProofFile && editingReading?.proofs && editingReading.proofs.length > 0 && (
                      <div className="mb-3 flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                        <button
                          type="button"
                          onClick={() => setPreviewImageUrl(editingReading.proofs![0].url)}
                          className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                          title="Xem ảnh hiện tại"
                        >
                          <img
                            src={editingReading.proofs[0].thumb_url || editingReading.proofs[0].url}
                            alt="Ảnh hiện tại"
                            className="h-full w-full object-cover"
                          />
                        </button>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ảnh hiện tại</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Chọn ảnh mới bên dưới để thay thế</p>
                        </div>
                      </div>
                    )}

                    {/* Upload ảnh mới */}
                    <input
                      type="file"
                      accept="image/*"
                      ref={editProofInputRef}
                      onChange={handleEditProofFileChange}
                      className="w-full text-sm text-slate-700 dark:text-slate-300 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-500/20 dark:file:text-indigo-300"
                    />

                    {/* Preview ảnh mới đã chọn */}
                    {editProofFile && editProofPreviewUrl && (
                      <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => setPreviewImageUrl(editProofPreviewUrl)}
                            className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
                            title="Xem ảnh mới"
                          >
                            <img src={editProofPreviewUrl} alt="Ảnh mới" className="h-full w-full object-cover" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-600 dark:text-slate-300 truncate" title={editProofFile.name}>
                              Ảnh mới: {editProofFile.name}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              {(editProofFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            <button
                              type="button"
                              onClick={clearEditProofSelection}
                              className="mt-2 inline-flex items-center rounded-md border border-red-200 dark:border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                              Huỷ chọn
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!editProofFile && (!editingReading?.proofs || editingReading.proofs.length === 0) && (
                      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Chưa có ảnh. Bạn có thể thêm ảnh bằng chứng.</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex-1"
                    >
                      Cập nhật
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingReading(null);
                        clearEditProofSelection();
                        setFormError('');
                      }}
                      className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex-1"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-0 text-white hover:text-slate-200"
              onClick={() => setPreviewImageUrl(null)}
              title="Đóng"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={previewImageUrl} alt="Ảnh đồng hồ" className="w-full max-h-[85vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
