import { useState, useEffect } from "react";
import { Button, Input, message } from "antd";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useOpenStore } from "../../../../Stores/OpenStore";

interface EditFloorForm {
  name: string;
}

interface FormErrors {
  name?: string;
  general?: string;
}

const EditFloor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const closeForm = useOpenStore((state) => state.setOpenForm);
  const [formData, setFormData] = useState<EditFloorForm>({
    name: "",
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
    // TODO: gọi API để lấy thông tin tầng theo id
    const mockData = { name: "Tầng 1" };
    setFormData(mockData);
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên tầng không được để trống";
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

      message.success("Cập nhật tầng thành công!");
      closeForm(false);
      navigate(-1);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || "Lỗi khi cập nhật tầng";
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
        <h1 className="text-2xl font-bold">Chỉnh sửa tầng</h1>
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

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            Tên tầng <span className="text-red-500">*</span>
          </label>
          <Input
            name="name"
            placeholder="Nhập tên tầng"
            value={formData.name}
            onChange={handleInputChange}
            status={errors.name ? "error" : ""}
            className="rounded"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
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

export default EditFloor;
