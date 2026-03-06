import Header from "./Header";
import { Outlet } from "react-router";
import SidebarAdmin from "./Sidebar";
import Authorization from "../../features/auth/components/verifyLogin";
import { useTokenStore } from "../../features/auth/stores/authStore";

const LayoutAdmin = () => {
  const role = useTokenStore((state) => state.role);
  const isLoading = useTokenStore((state) => state.isLoading);

  // Chờ auth state hydrate trước khi check quyền
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <>
      <Authorization role={role || ""} allowRole={["Admin", "Owner", "Manager", "Staff"]}>
        <div className="flex bg-[#f5f7fb] h-screen overflow-hidden">
          <SidebarAdmin />
          <main className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <div className="p-6 overflow-y-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </Authorization>
    </>
  );
};

export default LayoutAdmin;
