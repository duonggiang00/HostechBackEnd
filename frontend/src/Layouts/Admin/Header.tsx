import { Bell, Search, UserRoundCheck } from "lucide-react";
import ModalSetting from "../../features/auth/components/ModalSetting";
import { useOpenStore } from "../../shared/stores/openStore";
import { useUserInfo } from "../../Hooks/useUserInfo";

const Header = () => {
  const { openModalSetting } = useOpenStore();

  const { user } = useUserInfo();

  return (
    <div className="w-full p-4 border-b border-b-gray-300 shadow-sm">
      <section className="flex items-center justify-between">
        <div className="ml-5">
          <form className="relative">
            <input
              type="text"
              placeholder="Nhập nội dung cần tìm kiếm..."
              className="w-140 border border-gray-300 rounded-2xl p-1 pl-3 focus:outline-none"
            />
            <button
              className="absolute inset-y-0 right-3 cursor-pointer text-blue-950"
              type="button"
              title="Tìm kiếm"
            >
              <Search className="w-5" />
            </button>
          </form>
        </div>
        <div className="relative flex items-center gap-3 mr-5">
          <p className="w-12 h-12 border border-gray-300 rounded-full p-3 cursor-pointer hover:bg-gray-100">
            <Bell />
          </p>
          <p className="absolute -inset-y-1 right-15 w-5 h-5 bg-red-500 rounded-full text-center leading-5 text-white font-semibold text-xs">
            1
          </p>
          <ModalSetting open={openModalSetting}>
            <p
              className="w-12 h-12 border border-gray-300 rounded-full p-3 cursor-pointer hover:bg-gray-100 flex items-center justify-center"
              title={user?.full_name || "Người dùng"}
            >
              <UserRoundCheck />
            </p>
          </ModalSetting>
        </div>
      </section>
    </div>
  );
};

export default Header;
