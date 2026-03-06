import { Outlet } from "react-router";

/**
 * LayoutPortal (Tenant Space)
 * 
 * Giao diện dành riêng cho khách thuê.
 * Thiết kế Mobile-First, đơn giản hơn LayoutAdmin.
 */
const LayoutPortal = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-600">My Hostech</h1>
        <div className="w-8 h-8 bg-blue-100 rounded-full"></div>
      </header>

      <main className="flex-1 p-4 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around p-3">
        <div className="flex flex-col items-center text-blue-600">
           <span className="text-xs">Phòng tôi</span>
        </div>
        <div className="flex flex-col items-center text-gray-400">
           <span className="text-xs">Hợp đồng</span>
        </div>
        <div className="flex flex-col items-center text-gray-400">
           <span className="text-xs">Hóa đơn</span>
        </div>
        <div className="flex flex-col items-center text-gray-400">
           <span className="text-xs">Hỗ trợ</span>
        </div>
      </nav>
    </div>
  );
};

export default LayoutPortal;
