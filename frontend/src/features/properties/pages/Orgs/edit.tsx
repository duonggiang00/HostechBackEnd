import { useState, useEffect } from "react";
import { Button, Input, message } from "antd";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useOpenStore } from "../../../../Stores/OpenStore";

interface EditOrgForm {
  name: string;
  phone: string;
  email: string;
  address?: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  general?: string;
}

const EditOrg = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const closeForm = useOpenStore((state) => state.setOpenForm);
  const [formData, setFormData] = useState<EditOrgForm>({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      closeForm(false);
    };
  }, [closeForm]);

  useEffect(() => {
    // Lấy dữ liệu từ API
    // TODO: gọi API để lấy thông tin tổ chức theo id
    const mockData = {
      name: "Công ty TNHH TechNova",
      phone: "0901234567",
      email: "contact@technova.vn",
      address: "Tầng 5, 123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    };
    setFormData(mockData);
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên tổ chức không được để trống";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại không được để trống";
    } else if (!/^\d{10,11}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      console.log("data: ", formData);

      message.success("Cập nhật tổ chức thành công!");
      closeForm(false);
      navigate(-1);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || "Lỗi khi cập nhật tổ chức";
      setErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }));
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => {
            navigate(-1);
            closeForm(false);
          }}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Chỉnh sửa tổ chức</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border border-gray-300 rounded-lg p-6 max-w-full"
      >
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded text-red-700">
            {errors.general}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">
            Tên tổ chức <span className="text-red-500">*</span>
          </label>
          <Input
            name="name"
            placeholder="Nhập tên tổ chức"
            value={formData.name}
            onChange={handleInputChange}
            status={errors.name ? "error" : ""}
            className="rounded"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <Input
            name="phone"
            placeholder="Nhập số điện thoại"
            value={formData.phone}
            onChange={handleInputChange}
            status={errors.phone ? "error" : ""}
            className="rounded"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <Input
            name="email"
            placeholder="Nhập email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            status={errors.email ? "error" : ""}
            className="rounded"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Địa chỉ</label>
          <Input
            name="address"
            placeholder="Nhập địa chỉ"
            value={formData.address}
            onChange={handleInputChange}
            status={errors.address ? "error" : ""}
            className="rounded"
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="bg-blue-500"
          >
            Cập nhật
          </Button>
          <Button
            onClick={() => {
              navigate(-1);
              closeForm(false);
            }}
          >
            Hủy
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditOrg;
