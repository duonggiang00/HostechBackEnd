import { useForm } from "react-hook-form";
import { useOpenStore } from "../../../shared/stores/openStore";
import { Eye, EyeClosed, OctagonAlert, Loader } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { login } from "../api/authApi";
import type { ILogin } from "../types";
import { message } from "antd";
import { useNavigate } from "react-router";

import { useState } from "react";

import { useTokenStore } from "../stores/authStore";

const AuthPage = () => {
  const { eyePassword, setEyePassword } = useOpenStore();
  const nav = useNavigate();
  const setToken = useTokenStore((state) => state.setToken);
  const { register, handleSubmit, reset } = useForm<ILogin>();
  const [pendingLogin, setPendingLogin] = useState<ILogin | null>(null);
  const [orgs, setOrgs] = useState<any[]>([]);

  const loginMutation = useMutation({
    mutationFn: login,

    onSuccess: (res) => {
      const { token, user } = res.data;
      const roles = user.roles || [];
      const permissions = user.permissions || [];

      setToken(token, roles, permissions);
      message.success("Đăng nhập thành công");
      
      if (roles.some((r: string) => r.toLowerCase() === "tenant")) {
        nav("/me");
      } else {
        nav("/manage");
      }

      reset({});
    },

    onError: (err: any) => {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 422) {
        message.error("Sai email / số điện thoại hoặc mật khẩu");
      }

      if (status === 403) {
        message.error("Tài khoản đã bị khoá");
      }

      if (status === 423) {
        message.warning(`Tài khoản bị khoá tạm đến ${data.locked_until}`);
      }

      if (status === 409) {
        setOrgs(data.orgs);
      }
    },
  });

  const handleLogin = (data: ILogin) => {
    console.log(data);
    setPendingLogin(data);
    loginMutation.mutate(data);
  };
  return (
    <>
      {loginMutation.isPending && (
        <div className="fixed h-screen w-screen top-0 left-0 bg-black/50 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <Loader className="w-16 h-16 text-white animate-spin" />
            </div>
            <div className="text-white font-semibold text-lg">
              Đang đăng nhập...
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
                Welcome to Hostech
              </h2>
              <p className="text-gray-600">Vui lòng đăng nhập để tiếp tục</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8 shadow-lg">
              {orgs.length > 0 ? (
                <>
                  <h2 className="w-full text-center text-2xl font-bold text-gray-800 pb-4">
                    Chọn tổ chức / Cơ sở
                  </h2>
                  <p className="text-center text-gray-600 mb-6 text-sm">Tài khoản của bạn thuộc nhiều tổ chức, vui lòng chọn một tổ chức để tiếp tục.</p>
                  <div className="flex flex-col gap-3">
                    {orgs.map((org) => (
                      <button
                        key={org.org_id}
                        type="button"
                        onClick={() => {
                          if (!pendingLogin) return;
                          loginMutation.mutate({
                            ...pendingLogin,
                            org_id: org.org_id,
                          });
                        }}
                        disabled={loginMutation.isPending}
                        className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition shadow-sm"
                      >
                        <span className="font-semibold text-gray-800">{org.org_name}</span>
                      </button>
                    ))}
                  </div>
                  <button 
                    className="w-full mt-6 text-sm text-blue-600 hover:text-blue-800 transition text-center"
                    onClick={() => { setOrgs([]); setPendingLogin(null); }}
                  >
                    ← Quay lại đăng nhập
                  </button>
                </>
              ) : (
                <>
                  <h2 className="w-full text-center text-2xl font-bold text-gray-800 pb-6">
                    Đăng nhập tài khoản
                  </h2>
                  <form
                    onSubmit={handleSubmit(handleLogin)}
                    className="w-full flex flex-col gap-2"
                  >
                    <div className="flex flex-col w-full mb-4">
                      <label className="text-sm font-semibold text-gray-700 mb-2">
                        Tài khoản
                      </label>
                      <input
                        type="text"
                        placeholder="Email hoặc số điện thoại"
                        {...register("email", { required: true })}
                        className="w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 placeholder:text-gray-400 transition"
                      />
                      <span className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                        <OctagonAlert className="w-3.5 text-amber-500" />
                        Nhập số điện thoại hoặc email
                      </span>
                    </div>
                    <div className="relative flex flex-col w-full mb-6">
                      <label className="text-sm font-semibold text-gray-700 mb-2">
                        Mật khẩu
                      </label>
                      <input
                        type={eyePassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu đăng nhập"
                        {...register("password", { required: true })}
                        className="w-full border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 p-3 placeholder:text-gray-400 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setEyePassword(!eyePassword)}
                        className="absolute right-3 top-11 text-gray-500 hover:text-gray-700 transition"
                      >
                        {eyePassword ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeClosed className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-md hover:shadow-lg mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AuthPage;
