import { useState, useEffect } from "react";
import { Button, Input, Select, message } from "antd";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useOpenStore } from "../../../../Stores/OpenStore";

interface CreateRoomForm {
  name: string;
  floor_id?: string;
  zone_id?: string;
}

interface FormErrors {
  name?: string;
  floor_id?: string;
  general?: string;
}

const CreateRoom = () => {
  const navigate = useNavigate();
  const closeForm = useOpenStore((state) => state.setOpenForm);
  const [formData, setFormData] = useState<CreateRoomForm>({
    name: "",
    floor_id: "",
    zone_id: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      closeForm(false);
    };
  }, [closeForm]);

  const floors = [
    { id: "1", label: "Tầng 1", value: "1" },
    { id: "2", label: "Tầng 2", value: "2" },
    { id: "3", label: "Tầng 3", value: "3" },
  ];

  const zones = [
    { id: "1", label: "Khu 1", value: "1" },
    { id: "2", label: "Khu 2", value: "2" },
    { id: "3", label: "Khu 3", value: "3" },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên phòng không được để trống";
    }

    if (!formData.floor_id) {
      newErrors.floor_id = "Tầng không được để trống";
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

  const handleSelectChange = (name: string, value: string) => {
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

      message.success("Thêm phòng thành công!");
      closeForm(false);
      navigate(-1);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || "Lỗi khi thêm phòng";
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
        <h1 className="text-2xl font-bold">Thêm phòng mới</h1>
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
            Tên phòng <span className="text-red-500">*</span>
          </label>
          <Input
            name="name"
            placeholder="Nhập tên phòng"
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
            Tầng <span className="text-red-500">*</span>
          </label>
          <Select
            placeholder="Chọn tầng"
            value={formData.floor_id || undefined}
            onChange={(value) => handleSelectChange("floor_id", value)}
            options={floors}
            status={errors.floor_id ? "error" : ""}
          />
          {errors.floor_id && (
            <p className="text-red-500 text-sm mt-1">{errors.floor_id}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Khu</label>
          <Select
            placeholder="Chọn khu"
            value={formData.zone_id || undefined}
            onChange={(value) => handleSelectChange("zone_id", value)}
            options={zones}
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="bg-blue-500"
          >
            Thêm phòng
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

export default CreateRoom;
