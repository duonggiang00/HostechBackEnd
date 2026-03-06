import { useOutlet } from "react-router";
import ContractList from "./ContractList";

const Contracts = () => {
    const outlet = useOutlet();

    // Khi có route con (tạo/sửa/chi tiết/đã xóa), ẩn danh sách
    if (outlet) return outlet;

    return (
        <div className="p-4">
            <ContractList />
        </div>
    );
};

export default Contracts;
