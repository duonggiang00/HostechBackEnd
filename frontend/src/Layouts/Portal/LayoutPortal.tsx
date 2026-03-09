import { Outlet } from "react-router";
import { useOpenStore } from "../../shared/stores/openStore";
import ModalSetting from "../../features/auth/components/ModalSetting";
import { UserRoundCheck, Home, FileText, Receipt, LifeBuoy } from "lucide-react";

/**
 * LayoutPortal (Tenant Space)
 * 
 * Giao diện dành riêng cho khách thuê.
 * Thiết kế Mobile-First, đơn giản hơn LayoutAdmin.
 */
const LayoutPortal = () => {
  const { openModalSetting } = useOpenStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-600">My Hostech</h1>
        <ModalSetting open={openModalSetting}>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer text-blue-600 hover:bg-blue-200 transition">
            <UserRoundCheck size={20} />
          </div>
        </ModalSetting>
      </header>

      <main className="flex-1 p-4 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-3 z-10">
        <div className="flex flex-col items-center justify-center text-blue-600 gap-1 cursor-pointer">
           <Home size={20} />
           <span className="text-[10px] font-medium">Phòng tôi</span>
        </div>
        <div className="flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 gap-1 cursor-pointer transition">
           <FileText size={20} />
           <span className="text-[10px] font-medium">Hợp đồng</span>
        </div>
        <div className="flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 gap-1 cursor-pointer transition">
           <Receipt size={20} />
           <span className="text-[10px] font-medium">Hóa đơn</span>
        </div>
        <div className="flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 gap-1 cursor-pointer transition">
           <LifeBuoy size={20} />
           <span className="text-[10px] font-medium">Hỗ trợ</span>
        </div>
      </nav>
    </div>
  );
};

export default LayoutPortal;
