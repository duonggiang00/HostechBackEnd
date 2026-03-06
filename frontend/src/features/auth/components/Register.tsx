import React, { type ReactElement } from "react";
import { useOpenStore } from "../../../Stores/OpenStore";
import { Eye, EyeClosed } from "lucide-react";
import type { TGlobalProp } from "../../../Types/ReactType";
import { useForm, Controller } from "react-hook-form";
import { Select, message } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RegisterUser } from "../../../Services/Auth.service";

const Register = ({ children }: TGlobalProp<{ open: boolean }>) => {
  const { openRegister, eyePassword, setOpenRegister, setEyePassword } =
    useOpenStore();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
      password_confirm: "",
      role: "MANAGER",
    },
    mode: "onBlur",
  });

  const selectedRole = watch("role");
  const passwordValue = watch("password");

  const mutationRegisterUser = useMutation({
    mutationFn: RegisterUser,
    onSuccess: (res) => {
      message.success(res.data.message || "Đăng ký người dùng thành công");
      reset();
      setOpenRegister(false);
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Đăng ký thất bại";
      message.error(errorMessage);
    },
  });

  const onSubmit = async (data: any) => {
    // Validate password match
    if (data.password !== data.password_confirm) {
      message.error("Mật khẩu không khớp");
      return;
    }

    if (!data.email && !data.phone) {
      message.error("Vui lòng cung cấp ít nhất email hoặc số điện thoại.");
      return;
    }

    mutationRegisterUser.mutate({
      full_name: data.full_name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      password: data.password,
      role: data.role,
    });
  };

  return (
    <>
      {React.cloneElement(
        children as ReactElement,
        {
          onClick: () => {
            setOpenRegister(true);
          },
        } as { onClick: () => void },
      )}

      <div
        className={`fixed w-screen h-screen top-0 left-0 bg-black/40 duration-500 z-10 ${openRegister ? "opacity-100 visited" : "opacity-0 invisible"}`}
        onClick={() => setOpenRegister(!openRegister)}
      ></div>
      {openRegister && (
        <section
          className={`fixed top-[1.5%] left-[32%] z-50 w-150
    transition-transform duration-500 ease-in-out
  `}
        >
          <div
            className={`flex flex-col justify-center h-170 r bg-white border shadow-2xl shadow-blue-500 border-gray-300
             rounded-[10px] items-start p-10 transition-all duration-500 ease-in-out`}
          >
            <h2 className="w-full text-start text-2xl font-semibold pb-2">
              Đăng ký
            </h2>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="w-full flex flex-col gap-2 max-h-120 overflow-y-auto pr-2"
            >
              <div className="flex flex-col w-full">
                <label className="p-1 pl-3 font-medium">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("full_name", {
                    required: "Họ tên là bắt buộc",
                    maxLength: {
                      value: 255,
                      message: "Họ tên không vượt quá 255 ký tự",
                    },
                  })}
                  placeholder="Nhập họ tên..."
                  className={`w-full border ${
                    errors.full_name ? "border-red-500" : "border-gray-400"
                  } rounded-[10px] focus:outline-none p-2 focus:border-blue-500 transition`}
                />
                {errors.full_name && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.full_name.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col w-full">
                <label className="p-1 pl-3 font-medium">
                  Email{" "}
                  <span className="text-gray-400 text-sm">(hoặc SĐT)</span>
                </label>
                <input
                  type="email"
                  {...register("email", {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email không hợp lệ",
                    },
                    maxLength: {
                      value: 255,
                      message: "Email không vượt quá 255 ký tự",
                    },
                  })}
                  placeholder="Nhập email (hoặc bỏ trống)..."
                  className={`w-full border ${
                    errors.email ? "border-red-500" : "border-gray-400"
                  } rounded-[10px] focus:outline-none p-2 focus:border-blue-500 transition`}
                />
                {errors.email && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col w-full">
                <label className="p-1 pl-3 font-medium">
                  Số điện thoại{" "}
                  <span className="text-gray-400 text-sm">(hoặc Email)</span>
                </label>
                <input
                  type="tel"
                  {...register("phone", {
                    pattern: {
                      value: /^[0-9]{10,11}$/,
                      message: "Số điện thoại phải từ 10-11 chữ số",
                    },
                    maxLength: {
                      value: 30,
                      message: "Số điện thoại không vượt quá 30 ký tự",
                    },
                  })}
                  placeholder="Nhập số điện thoại (hoặc bỏ trống)..."
                  className={`w-full border ${
                    errors.phone ? "border-red-500" : "border-gray-400"
                  } rounded-[10px] focus:outline-none p-2 focus:border-blue-500 transition`}
                />
                {errors.phone && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.phone.message}
                  </span>
                )}
                <span className="text-gray-400 text-xs mt-1 pl-3">
                  ⚠️ Phải cung cấp ít nhất email hoặc số điện thoại
                </span>
              </div>

              <div className="relative flex flex-col w-full">
                <label className="p-1 pl-3 font-medium">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type={eyePassword ? "text" : "password"}
                  {...register("password", {
                    required: "Mật khẩu là bắt buộc",
                    minLength: {
                      value: 8,
                      message: "Mật khẩu phải ít nhất 8 ký tự",
                    },
                  })}
                  placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)..."
                  className={`w-full border ${
                    errors.password ? "border-red-500" : "border-gray-400"
                  } rounded-[10px] focus:outline-none p-2 focus:border-blue-500 transition pr-10`}
                />
                <div className="absolute inset-y-10 right-4">
                  {eyePassword ? (
                    <Eye
                      onClick={() => setEyePassword(false)}
                      className="cursor-pointer text-gray-600"
                      size={18}
                    />
                  ) : (
                    <EyeClosed
                      onClick={() => setEyePassword(true)}
                      className="cursor-pointer text-gray-600"
                      size={18}
                    />
                  )}
                </div>
                {errors.password && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <div className="relative flex flex-col w-full">
                <label className="p-1 pl-3 font-medium">
                  Nhập lại mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type={eyePassword ? "text" : "password"}
                  {...register("password_confirm", {
                    required: "Vui lòng nhập lại mật khẩu",
                  })}
                  placeholder="Nhập lại mật khẩu..."
                  className={`w-full border ${
                    errors.password_confirm ||
                    (passwordValue &&
                      passwordValue !== watch("password_confirm"))
                      ? "border-red-500"
                      : "border-gray-400"
                  } rounded-[10px] focus:outline-none p-2 focus:border-blue-500 transition pr-10`}
                />
                <div className="absolute inset-y-10 right-4">
                  {eyePassword ? (
                    <Eye
                      onClick={() => setEyePassword(false)}
                      className="cursor-pointer text-gray-600"
                      size={18}
                    />
                  ) : (
                    <EyeClosed
                      onClick={() => setEyePassword(true)}
                      className="cursor-pointer text-gray-600"
                      size={18}
                    />
                  )}
                </div>
                {errors.password_confirm && (
                  <span className="text-red-500 text-xs mt-1">
                    {errors.password_confirm.message}
                  </span>
                )}
                {passwordValue &&
                  passwordValue !== watch("password_confirm") && (
                    <span className="text-red-500 text-xs mt-1">
                      Mật khẩu không khớp
                    </span>
                  )}
              </div>

              <div className="flex flex-col w-full">
                <label className="p-1 pl-3 font-medium">
                  Chức vụ <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="role"
                  control={control}
                  rules={{ required: "Chức vụ là bắt buộc" }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      placeholder="Chọn chức vụ"
                      className="w-full"
                      style={{ width: "100%" }}
                      options={[
                        {
                          label: (
                            <span className="font-medium">👨‍💼 Manager</span>
                          ),
                          value: "MANAGER",
                          title: "Quản lý toàn bộ tài sản",
                        },
                        {
                          label: (
                            <span className="font-medium">👤 Nhân viên</span>
                          ),
                          value: "STAFF",
                          title: "Nhân viên hỗ trợ",
                        },
                        {
                          label: (
                            <span className="font-medium">
                              🏠 Người thuê nhà
                            </span>
                          ),
                          value: "TENANT",
                          title: "Khách hàng thuê phòng",
                        },
                      ]}
                      onChange={(value) => field.onChange(value)}
                    />
                  )}
                />
                {selectedRole && (
                  <p className="text-xs text-blue-600 mt-2 pl-3 bg-blue-50 p-2 rounded">
                    {selectedRole === "MANAGER" &&
                      "ℹ️ Có quyền quản lý toàn bộ tài sản và nhân viên"}
                    {selectedRole === "STAFF" &&
                      "ℹ️ Có quyền quản lý một số tài sản được phân công"}
                    {selectedRole === "TENANT" &&
                      "ℹ️ Khách hàng thuê và quản lý hợp đồng thuê của mình"}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2 items-center">
                <button
                  type="button"
                  className="w-full cursor-pointer flex items-center justify-center hover:font-semibold border border-gray-300 p-2 rounded-[10px] hover:bg-gray-50 transition"
                >
                  Đăng ký bằng Google
                  <img
                    src="/images/Auth/gg.png"
                    alt="google"
                    className="w-6 ml-2"
                  />
                </button>
              </div>

              <div className="flex justify-end items-center gap-2 mt-5">
                <button
                  type="submit"
                  disabled={mutationRegisterUser.isPending}
                  className="w-35 p-2 bg-red-500 rounded-[10px] cursor-pointer text-white hover:font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mutationRegisterUser.isPending
                    ? "Đang đăng ký..."
                    : "Đăng ký"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setOpenRegister(false);
                  }}
                  className="border border-gray-300 p-2 rounded-2xl w-35 hover:bg-gray-200 text-green-500 font-semibold cursor-pointer hover:font-bold transition"
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </>
  );
};

export default Register;
