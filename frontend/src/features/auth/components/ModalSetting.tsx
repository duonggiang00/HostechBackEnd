import React, { type ReactElement } from "react";
import { useOpenStore } from "../../../Stores/OpenStore";
import type { TGlobalProp } from "../../../Types/ReactType";
import { LogOut, User, UserCheck } from "lucide-react";
import { useUserInfo } from "../../../Hooks/useUserInfo";
import { useTokenStore } from "../stores/authStore";
import { Link, useNavigate } from "react-router";
import { message } from "antd";
import { Logout } from "../../../Services/Auth.service";

const ModalSetting = ({ children }: TGlobalProp<{ open: boolean }>) => {
  const { openModalSetting, setOpenModalSetting } = useOpenStore();
  const { user, isLoading } = useUserInfo();
  const clearToken = useTokenStore((state) => state.clearToken);
  const navigate = useNavigate();

  console.log("user", user);
  const handleLogout = async () => {
    try {
      await Logout();
      message.success("Đăng xuất thành công!");
    } catch {
      // Bỏ qua lỗi server khi logout (vẫn xóa token local)
    } finally {
      clearToken();
      setOpenModalSetting(false);
      navigate("/auth");
    }
  };

  return (
    <>
      {React.cloneElement(
        children as ReactElement,
        {
          onClick: () => {
            setOpenModalSetting(true);
          },
        } as { onClick: () => void },
      )}
      <div
        className={`fixed w-screen h-screen top-0 left-0 duration-500 z-10 cursor-pointer ${openModalSetting ? "opacity-100 visited" : "opacity-0 invisible"}`}
        onClick={() => setOpenModalSetting(!openModalSetting)}
      ></div>
      {openModalSetting && (
        <div className="fixed w-72 border border-gray-300 top-22 right-5 rounded-[10px] bg-white z-20 shadow-lg">
          <div className="flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-[10px]">
              {isLoading ? (
                <div className="h-20 flex items-center justify-center">
                  <span className="text-gray-500">Đang tải...</span>
                </div>
              ) : user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck size={14} className="text-blue-600" />
                    <span className="text-[15px]">
                      Xin chào {user.data.full_name || "Quản trị viên"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">
                  Không có thông tin người dùng
                </div>
              )}
            </div>

            <div>
              <ul className="flex flex-col">
                <Link to="profile">
                  <li
                    onClick={() => setOpenModalSetting(false)}
                    className="p-3 hover:bg-gray-100 cursor-pointer flex items-center gap-2 transition border-b border-gray-100"
                  >
                    <User size={16} className="text-gray-600" />
                    <span className="text-[15px]">Thông tin cá nhân</span>
                  </li>
                </Link>
                <li
                  onClick={handleLogout}
                  className="p-3 hover:bg-red-50 cursor-pointer flex items-center gap-2 transition text-red-600 hover:text-red-700 font-medium"
                >
                  <LogOut size={16} />
                  <span className="text-[15px]">Đăng xuất</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalSetting;
