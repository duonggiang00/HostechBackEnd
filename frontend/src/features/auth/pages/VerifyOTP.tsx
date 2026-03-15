import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router";
import { message } from "antd";
import type { IDecodeJWT, IOtpVerify } from "../types";
import { resendOTP, verifyOTP } from "../api/authApi";
import { jwtDecode } from "jwt-decode";
import { useTokenStore } from "../stores/authStore";

const VerifyOTP = () => {
  const setToken = useTokenStore((state) => state.setToken);
  const { register, handleSubmit } = useForm<IOtpVerify>();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [time, setTime] = useState<number>(60);

  const { session_id, org_id, dev_otp } = location.state || {};

  if (!session_id || !org_id) {
    message.error("Phiên xác thực không hợp lệ, vui lòng đăng nhập lại");
    navigate("/auth");
    return null;
  }

  const handleOTP = async (data: IOtpVerify) => {
    try {
      setLoading(true);
      const res = await verifyOTP({
        session_id,
        org_id,
        otp: data.otp,
      });

      // Giải mã token để lấy role và org_id
      const decoded = jwtDecode<IDecodeJWT>(res.data.access_token);
      const roles = decoded.user?.roles || [];
      const permissions = decoded.user?.permissions || [];
      const orgId = decoded.user?.org_id || null;
      
      setToken(res.data.access_token, roles, permissions, orgId);

      message.success("Xác thực OTP thành công");
      
      if (roles.some((r: string) => r.toLowerCase() === "tenant")) {
        navigate("/me");
      } else {
        navigate("/manage");
      }

    } catch (err: any) {
      console.error(err);

      // phân biệt lỗi
      if (err?.response?.status === 401) {
        message.error("Phiên đăng nhập không hợp lệ hoặc token lỗi");
      } else {
        message.error(err?.response?.data?.message || "OTP không hợp lệ");
      }
    }
  };

  const handleResendOTP = async () => {
    try {
      const res = await resendOTP({ org_id, session_id });
      message.success(res.data.message);

      // chỉ dùng khi local/dev
      if (res.data?.dev_otp) {
        console.log("DEV OTP:", res.data.dev_otp);
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không thể gửi lại OTP");
    }
  };

  useEffect(() => {
    if (time === 0) return;

    const timer = setTimeout(() => {
      setTime(time - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [time]);

  return (
    <>
      {loading && (
        <div className="fixed h-screen w-screen top-0 left-0 bg-black/50 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <svg
                className="w-16 h-16 text-white animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <div className="text-white font-semibold text-lg">
              Đang xác thực...
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <section className="flex w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex-col items-center justify-center p-12">
            <img
              src="/images/logo_du_an.jpg"
              alt="Hostech"
              className="w-40 h-40 rounded-full border-4 border-white shadow-lg mb-6"
            />
            <h1 className="text-white text-4xl font-bold text-center mb-2">
              Hostech
            </h1>
            <p className="text-blue-100 text-center text-lg">
              Quản lý khu nhà và người dùng
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-center p-8 lg:p-12">
            <div className="mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                Xác thực OTP
              </h2>
              <p className="text-gray-600">
                Nhập mã OTP đã gửi đến số điện thoại của bạn
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 shadow-lg">
              <h2 className="w-full text-center text-2xl font-bold text-gray-800 pb-6">
                Nhập mã xác thực
              </h2>

              {dev_otp && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">OTP Dev:</span>{" "}
                    <span className="font-mono font-bold text-lg text-yellow-900">
                      {dev_otp}
                    </span>
                  </p>
                </div>
              )}

              <form
                onSubmit={handleSubmit(handleOTP)}
                className="w-full flex flex-col gap-2"
              >
                <div className="flex flex-col w-full mb-6">
                  <label className="text-sm font-semibold text-gray-700 mb-2">
                    Mã OTP
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập mã OTP 6 chữ số"
                    {...register("otp", { required: true })}
                    className="w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 placeholder:text-gray-400 text-center text-2xl font-bold tracking-widest transition"
                    maxLength={6}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Đang xác thực..." : "Xác nhận"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleResendOTP();
                      setTime(60);
                    }}
                    disabled={time > 0}
                    className="w-full py-2 border-2 border-blue-500 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400"
                  >
                    Gửi lại mã
                  </button>
                </div>
                <div className="text-center mt-6">
                  {time > 0 ? (
                    <p className="text-sm text-gray-600">
                      Gửi lại mã trong:{" "}
                      <span className="font-bold text-blue-600">
                        00:{String(time).padStart(2, "0")}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Bạn chưa nhận được mã?
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default VerifyOTP;
