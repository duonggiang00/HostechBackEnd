import { Table, Button, Tooltip } from "antd";
import { usePageStore } from "../../../../Stores/PageStore";
import { Plus, Edit, Eye } from "lucide-react";
import { Outlet, useNavigate } from "react-router";
import { useOpenStore } from "../../../../Stores/OpenStore";
import type { ColumnsType } from "antd/es/table";

const Orgs = () => {
  const { pages, pageSizes, setPage, setPageSize } = usePageStore();
  const { openForm, setOpenForm } = useOpenStore();
  const navigate = useNavigate();

  const mockOrgs = [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Công ty TNHH TechNova",
      phone: "0901234567",
      email: "contact@technova.vn",
      address: "Tầng 5, 123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
    },
    {
      id: "6fa459ea-ee8a-3ca4-894e-db77e160355e",
      name: "Công ty Cổ phần GreenSoft",
      phone: "0912345678",
      email: "info@greensoft.vn",
      address: "45 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
    },
  ];

  const columns: ColumnsType<any> = [
    {
      title: "Tên tổ chức",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: any) => (
        <div className="flex gap-2">
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<Eye size={15} />}
              onClick={() => {
                setOpenForm(true);
                navigate(`detailOrg/${record.id}`);
              }}
              style={{
                backgroundColor: "#22c55e",
                borderColor: "#22c55e",
                color: "white",
              }}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              icon={<Edit size={15} />}
              onClick={() => {
                setOpenForm(true);
                navigate(`editOrg/${record.id}`);
              }}
              style={{
                backgroundColor: "#0ea5e9",
                borderColor: "#0ea5e9",
                color: "white",
              }}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      {openForm == false ? (
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between border p-2 border-gray-300 rounded-[10px]">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] pl-2 font-bold">Tên tổ chức</label>
              <input
                type="text"
                placeholder="Tìm kiếm tổ chức..."
                className="border border-gray-400 w-50 rounded-[10px] p-1 pl-2 focus:outline-none placeholder:text-[13px]"
              />
            </div>
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => {
                setOpenForm(true);
                navigate("createOrg");
              }}
              className="bg-blue-600"
            >
              Thêm tổ chức
            </Button>
          </div>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={mockOrgs}
            pagination={{
              current: pages,
              pageSize: pageSizes,
              total: mockOrgs?.length,
              onChange: (p: number, ps: number) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
          />
        </section>
      ) : (
        <Outlet />
      )}
    </>
  );
};

export default Orgs;
