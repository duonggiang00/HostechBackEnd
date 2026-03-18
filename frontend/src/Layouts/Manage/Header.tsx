import { Bell, Search, UserRoundCheck } from "lucide-react";
import ModalSetting from "../../features/auth/components/ModalSetting";
import { useOpenStore } from "../../shared/stores/openStore";
import { useUserInfo } from "../../Hooks/useUserInfo";
import { PremiumContextSwitcher } from "../../features/properties/components/PremiumContextSwitcher";

const Header = () => {
  const { openModalSetting } = useOpenStore();
  const { user } = useUserInfo();

  return (
    <div className="w-full px-6 py-4 bg-white/70 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="hidden lg:block">
            <form className="relative group">
              <input
                type="text"
                placeholder="Tìm kiếm nhanh..."
                className="w-80 bg-gray-100/50 border border-gray-200 rounded-2xl py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </form>
          </div>
          <PremiumContextSwitcher />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <button className="p-2.5 bg-gray-100/50 hover:bg-white border border-transparent hover:border-gray-200 rounded-xl transition-all cursor-pointer relative">
              <Bell size={20} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>

          <div className="h-8 w-[1px] bg-gray-200 mx-2"></div>

          <ModalSetting open={openModalSetting}>
            <button
              className="flex items-center gap-3 p-1.5 pr-4 hover:bg-gray-100/50 rounded-xl transition-all cursor-pointer group"
              title={user?.full_name || "Tài khoản"}
            >
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                <UserRoundCheck size={18} />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-gray-900 leading-tight truncate max-w-[120px]">
                  {user?.full_name}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">Quản trị viên</p>
              </div>
            </button>
          </ModalSetting>
        </div>
      </section>
    </div>
  );
};

export default Header;
