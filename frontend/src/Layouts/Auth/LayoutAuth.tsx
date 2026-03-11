import { Outlet } from "react-router";

const LayoutAuth = () => {
  return (
    <>
      {/* Trong tương lai có thể thêm Header Auth (chọn ngôn ngữ, help) tại đây */}
      <Outlet />
    </>
  );
};

export default LayoutAuth;
