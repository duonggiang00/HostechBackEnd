import { useOutlet } from "react-router";
import ServiceList from "../components/ServiceList";
import ServiceCalculator from "../components/ServiceCalculator";

const Services = () => {
    const outlet = useOutlet();

    // Nếu đang ở trang con (thêm/sửa), chỉ render trang đó
    if (outlet) return outlet;

    // Còn lại hiển thị danh sách dịch vụ
    return (
        <div className="p-4 flex gap-6 flex-col lg:flex-row">
            <div className="flex-1">
                <ServiceList />
            </div>
            <div className="w-full lg:w-1/3">
                <ServiceCalculator />
            </div>
        </div>
    );
};

export default Services;

