import { useState, useEffect } from "react";
import { Button, Input, Select, message } from "antd";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useOpenStore } from "../../../../Stores/OpenStore";
import type { FormErrors, MeterForm } from "../../../../Types/Meter.Type";

const EditMeter = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const closeForm = useOpenStore((state) => state.setOpenForm);
  const [formData, setFormData] = useState<MeterForm>({
    name: "",
    room_id: "",
    meter_type: "",
    meter_number: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      closeForm(false);
    };
  }, [closeForm]);

  const rooms = [
    { id: "1", label: "Phòng 101", value: "1" },
    { id: "2", label: "Phòng 102", value: "2" },
    { id: "3", label: "Phòng 201", value: "3" },
  ];

  const meterTypes = [
    { id: "1", label: "Điện", value: "Điện" },
    { id: "2", label: "Nước", value: "Nước" },
    { id: "3", label: "Gas", value: "Gas" },
  ];

  useEffect(() => {
    const mockData = {
      name: "Đồng hồ điện 101",
      room_id: "1",
      meter_type: "Điện",
      meter_number: "DL12345678",
    };
    setFormData(mockData);
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên đồng hồ không được để trống";
    }

    if (!formData.room_id) {
      newErrors.room_id = "Phòng không được để trống";
    }

    if (!formData.meter_type) {
      newErrors.meter_type = "Loại đồng hồ không được để trống";
    }

    if ((formData.meter_number ?? "").trim()) {
      newErrors.meter_number = "Số hiệu không được để trống";
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

      message.success("Cập nhật đồng hồ thành công!");
      closeForm(false);
      navigate(-1);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || "Lỗi khi cập nhật đồng hồ";
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
        <h1 className="text-2xl font-bold">Cập nhật đồng hồ</h1>
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
            Tên đồng hồ <span className="text-red-500">*</span>
          </label>
          <Input
            name="name"
            placeholder="Nhập tên đồng hồ"
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
            Phòng <span className="text-red-500">*</span>
          </label>
          <Select
            placeholder="Chọn phòng"
            options={rooms}
            value={formData.room_id || undefined}
            onChange={(value) => handleSelectChange("room_id", value)}
            status={errors.room_id ? "error" : ""}
            className="w-full"
          />
          {errors.room_id && (
            <p className="text-red-500 text-sm mt-1">{errors.room_id}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">
            Loại đồng hồ <span className="text-red-500">*</span>
          </label>
          <Select
            placeholder="Chọn loại đồng hồ"
            options={meterTypes}
            value={formData.meter_type || undefined}
            onChange={(value) => handleSelectChange("meter_type", value)}
            status={errors.meter_type ? "error" : ""}
            className="w-full"
          />
          {errors.meter_type && (
            <p className="text-red-500 text-sm mt-1">{errors.meter_type}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            Số hiệu <span className="text-red-500">*</span>
          </label>
          <Input
            name="meter_number"
            placeholder="Nhập số hiệu đồng hồ"
            value={formData.meter_number}
            onChange={handleInputChange}
            status={errors.meter_number ? "error" : ""}
            className="rounded"
          />
          {errors.meter_number && (
            <p className="text-red-500 text-sm mt-1">{errors.meter_number}</p>
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

export default EditMeter;
