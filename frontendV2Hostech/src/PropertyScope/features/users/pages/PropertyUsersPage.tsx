import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Mail, UserPlus, Search, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { usePropertyUsers } from '../hooks/usePropertyUsers';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import InviteUserModal from '../components/InviteUserModal';

type TabType = 'active' | 'pending';

export default function PropertyUsersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { propertyId } = useParams<{ propertyId: string }>();

  // Use server-side pagination
  const { usersQuery, invitationsQuery, revokeMutation } = usePropertyUsers({
    page,
    per_page: 15,
    search: searchQuery, // could be debounced
  });

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn thu hồi lời mời này?')) return;
    try {
      await revokeMutation.mutateAsync(id);
      toast.success('Đã thu hồi lời mời.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể thu hồi lời mời.');
    }
  };

  // Dữ liệu từ API trả về đã có dạng PaginatedResponse { data, meta }
  const usersList = usersQuery.data?.data || [];
  const invitationsList = invitationsQuery.data?.data || [];
  const usersMeta = usersQuery.data?.meta;
  const invitationsMeta = invitationsQuery.data?.meta;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-700">
      {/* Tiêu đề trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black bg-gradient-to-br from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                Cư dân & Nhân sự
              </h1>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                Quản lý quyền truy cập tòa nhà hiện tại
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold transition-all active:scale-95 group"
          >
            <Mail className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            <span className="hidden sm:inline">Gửi lời mời</span>
          </button>
          
          <button 
            onClick={() => navigate(`/properties/${propertyId}/users/create`)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all active:scale-95 group"
          >
            <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Thêm mới
          </button>
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Thanh công cụ: Tabs & Tìm kiếm */}
        <div className="border-b border-slate-100 dark:border-slate-700/50 p-4 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Tabs chuyển đổi */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto custom-scrollbar relative">
            {/* Hiệu ứng trượt Tab */}
            <motion.div
              layoutId="active-tab-indicator-users"
              className="absolute inset-y-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm z-0"
              initial={false}
              animate={{
                width: activeTab === 'active' ? '50%' : '50%',
                left: activeTab === 'active' ? '6px' : 'calc(50% - 2px)',
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            
            <button
              onClick={() => { setActiveTab('active'); setPage(1); }}
              className={`relative z-10 flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                activeTab === 'active' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              Đang hoạt động ({usersMeta?.total || '--'})
            </button>
            <button
              onClick={() => { setActiveTab('pending'); setPage(1); }}
              className={`relative z-10 flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                activeTab === 'pending' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              Chờ xác nhận ({invitationsMeta?.total || '--'})
            </button>
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo tên, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
            />
          </div>
        </div>

        {/* Nội dung hiển thị theo Tab */}
        <div className="p-0">
          <AnimatePresence mode="wait">
            {activeTab === 'active' && (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-x-auto"
              >
                {usersQuery.isLoading ? (
                  <div className="p-12 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" /></div>
                ) : usersList.length > 0 ? (
                  <>
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Người dùng</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Vai trò</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Trạng thái</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {usersList.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                                {user.avatar_url ? (
                                   <img src={user.avatar_url} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                                ) : (
                                   user.full_name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 dark:text-slate-100">{user.full_name}</p>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tight ${
                              user.role === 'Tenant' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 
                              'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {user.roles?.[0] || user.role || 'NA'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-black uppercase tracking-tight">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => navigate(`/properties/${propertyId}/users/${user.id}`)}
                              className="px-4 py-2 text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 dark:border-indigo-500/30 dark:text-indigo-400 dark:hover:text-white dark:hover:bg-indigo-500 rounded-xl transition-all shadow-sm"
                            >
                              Xem hồ sơ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usersMeta && usersMeta.last_page > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Hiển thị {usersMeta.from} tới {usersMeta.to} trong {usersMeta.total} kết quả
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handlePageChange(usersMeta.current_page - 1)}
                          disabled={usersMeta.current_page === 1}
                          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Trước
                        </button>
                        <button 
                          onClick={() => handlePageChange(usersMeta.current_page + 1)}
                          disabled={usersMeta.current_page === usersMeta.last_page}
                          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </>
                ) : (
                  <div className="p-12 text-center text-slate-500">
                     <Users className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                     <p className="font-bold">Không tìm thấy cư dân hoặc nhân viên nào.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'pending' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="overflow-x-auto"
              >
                  {invitationsQuery.isLoading ? (
                  <div className="p-12 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" /></div>
                ) : invitationsList.length > 0 ? (
                  <>
                    <table className="w-full text-left whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Email nhận</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Vai trò</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700">Ngày gửi</th>
                          <th className="px-6 py-4 font-bold border-b border-slate-100 dark:border-slate-700 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {invitationsList.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold border border-orange-100 dark:border-orange-800/50">
                                <Mail className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900 dark:text-slate-100">{inv.email}</p>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                                  Gửi bởi: {inv.inviter?.name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tight ${
                              inv.role_name === 'Tenant' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 
                              'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {inv.role_name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                               {new Date(inv.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                               Hết hạn: {new Date(inv.expires_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             {!inv.registered_at && (
                                <button 
                                  onClick={() => handleRevoke(inv.id)}
                                  className="flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-colors font-bold text-xs uppercase tracking-wider ml-auto"
                                >
                                  <Trash2 className="w-4 h-4" /> Thu hồi
                                </button>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {invitationsMeta && invitationsMeta.last_page > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/30">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Hiển thị {invitationsMeta.from} tới {invitationsMeta.to} trong {invitationsMeta.total} kết quả
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handlePageChange(invitationsMeta.current_page - 1)}
                          disabled={invitationsMeta.current_page === 1}
                          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Trước
                        </button>
                        <button 
                          onClick={() => handlePageChange(invitationsMeta.current_page + 1)}
                          disabled={invitationsMeta.current_page === invitationsMeta.last_page}
                          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </>
                ) : (
                  <div className="p-12 text-center text-slate-500">
                     <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                     <p className="font-bold">Không có lời mời nào đang chờ xác nhận.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <InviteUserModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    </div>
  );
}
