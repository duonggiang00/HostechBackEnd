import { useState, useEffect } from "react";
import { Button, Input, message } from "antd";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useOpenStore } from "../../../../Stores/OpenStore";

interface EditPropertyForm {
  name: string;
  owner: string;
  address?: string;
}

interface FormErrors {
  name?: string;
  owner?: string;
  address?: string;
  general?: string;
}

const EditProperty = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const closeForm = useOpenStore((state) => state.setOpenForm);
  const [formData, setFormData] = useState<EditPropertyForm>({
    name: "",
    owner: "",
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
    const mockData = {
      name: "Nhà 01",
      owner: "Anh A",
      address: "123 Đường ABC",
    };
    setFormData(mockData);
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên nhà không được để trống";
    }

    if (!formData.owner.trim()) {
      newErrors.owner = "Chủ nhà không được để trống";
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

      message.success("Cập nhật nhà thành công!");
      closeForm(false);
      navigate(-1);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || "Lỗi khi cập nhật nhà";
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
            (navigate(-1), closeForm(false));
          }}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">Cập nhật nhà</h1>
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
            Tên nhà <span className="text-red-500">*</span>
          </label>
          <Input
            name="name"
            placeholder="Nhập tên nhà"
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
            Chủ nhà <span className="text-red-500">*</span>
          </label>
          <Input
            name="owner"
            placeholder="Nhập tên chủ nhà"
            value={formData.owner}
            onChange={handleInputChange}
            status={errors.owner ? "error" : ""}
            className="rounded"
          />
          {errors.owner && (
            <p className="text-red-500 text-sm mt-1">{errors.owner}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Địa chỉ</label>
          <Input
            name="address"
            placeholder="Nhập địa chỉ nhà"
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
          <Button onClick={() => navigate(-1)}>Hủy</Button>
        </div>
      </form>
    </div>
  );
};

export default EditProperty;
