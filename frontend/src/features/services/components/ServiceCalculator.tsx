import { useState } from "react";
import { Card, Select, InputNumber, Descriptions } from "antd";
import { ServiceCalcMode, ServiceCalcModeLabels } from "../../../Types/ServiceTypes";
import { useQuery } from "@tanstack/react-query";
import { getServices } from "../api/serviceApi";

const ServiceCalculator = () => {
    const { data: services } = useQuery({ queryKey: ["services"], queryFn: getServices });
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [inputs, setInputs] = useState<{ quantity?: number; oldDiff?: number; newDiff?: number }>({});

    const selectedService = services?.find((s) => s.id === selectedServiceId);

    const calculateCost = () => {
        if (!selectedService) return 0;
        const price = selectedService.price || 0;

        switch (selectedService.calc_mode) {
            case ServiceCalcMode.PER_PERSON:
            case ServiceCalcMode.QUANTITY:
                return price * (inputs.quantity || 0);
            case ServiceCalcMode.PER_ROOM:
                return price;
            case ServiceCalcMode.PER_METER:
                const usage = (inputs.newDiff || 0) - (inputs.oldDiff || 0);
                return price * (usage > 0 ? usage : 0);
            default:
                return 0;
        }
    };

    return (
        <Card title="Tính thử chi phí phòng mẫu" className="shadow-md" size="small">
            <div className="flex flex-col gap-3">
                <div>
                    <label className="block text-sm font-medium mb-1">Chọn dịch vụ</label>
                    <Select
                        className="w-full"
                        placeholder="Chọn dịch vụ để tính"
                        onChange={setSelectedServiceId}
                        value={selectedServiceId}
                    >
                        {services?.map((s) => (
                            <Select.Option key={s.id} value={s.id}>
                                {s.name} ({ServiceCalcModeLabels[s.calc_mode]}) - {s.price?.toLocaleString()}đ/{s.unit}
                            </Select.Option>
                        ))}
                    </Select>
                </div>

                {selectedService && (
                    <div className="bg-gray-50 p-3 rounded-md flex flex-col gap-3">
                        {(selectedService.calc_mode === ServiceCalcMode.PER_PERSON ||
                            selectedService.calc_mode === ServiceCalcMode.QUANTITY) && (
                                <div>
                                    <label className="block text-xs mb-1">Số lượng ({selectedService.unit})</label>
                                    <InputNumber
                                        className="w-full"
                                        min={0}
                                        value={inputs.quantity}
                                        onChange={(v) => setInputs((prev) => ({ ...prev, quantity: v || 0 }))}
                                    />
                                </div>
                            )}

                        {selectedService.calc_mode === ServiceCalcMode.PER_METER && (
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-xs mb-1">Chỉ số cũ</label>
                                    <InputNumber
                                        className="w-full"
                                        min={0}
                                        value={inputs.oldDiff}
                                        onChange={(v) => setInputs((prev) => ({ ...prev, oldDiff: v || 0 }))}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs mb-1">Chỉ số mới</label>
                                    <InputNumber
                                        className="w-full"
                                        min={0}
                                        value={inputs.newDiff}
                                        onChange={(v) => setInputs((prev) => ({ ...prev, newDiff: v || 0 }))}
                                    />
                                </div>
                            </div>
                        )}

                        <Descriptions column={1} size="small" className="mt-2">
                            <Descriptions.Item label="Đơn giá">{selectedService.price?.toLocaleString()} VNĐ</Descriptions.Item>
                            <Descriptions.Item label="Thành tiền">
                                <span className="text-lg font-bold text-blue-600">
                                    {calculateCost().toLocaleString()} VNĐ
                                </span>
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ServiceCalculator;
