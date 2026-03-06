import { Table, Button, Tooltip } from "antd";
import { usePageStore } from "../../../../Stores/PageStore";
import { Plus, Edit, Eye } from "lucide-react";
import { Outlet, useNavigate } from "react-router";
import { useOpenStore } from "../../../../Stores/OpenStore";
import type { ColumnsType } from "antd/es/table";

const Meters = () => {
  const { pages, pageSizes, setPage, setPageSize } = usePageStore();
  const { openForm, setOpenForm } = useOpenStore();
  const navigate = useNavigate();

  const data = [
    {
      id: 1,
      name: "Đồng hồ điện 101",
      room_id: { id: 1, name: "Phòng 101" },
      meter_type: "Điện",
      meter_number: "DL12345678",
      status: 1,
    },
    {
      id: 2,
      name: "Đồng hồ nước 101",
      room_id: { id: 1, name: "Phòng 101" },
      meter_type: "Nước",
      meter_number: "NC87654321",
      status: 1,
    },
  ];

  const columns: ColumnsType<any> = [
    {
      title: "Tên đồng hồ",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Phòng",
      dataIndex: ["room_id", "name"],
      key: "room",
    },
    {
      title: "Loại",
      dataIndex: "meter_type",
      key: "meter_type",
      render: (type: string) => (
        <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-sm font-medium">
          {type}
        </span>
      ),
    },
    {
      title: "Số hiệu",
      dataIndex: "meter_number",
      key: "meter_number",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: number) => (
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            status === 1
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status === 1 ? "Hoạt động" : "Không hoạt động"}
        </span>
      ),
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
                navigate(`detailMeter/${record.id}`);
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
                navigate(`editMeter/${record.id}`);
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
              <label className="text-[13px] pl-2 font-bold">Tên đồng hồ</label>
              <input
                type="text"
                placeholder="Tìm kiếm đồng hồ..."
                className="border border-gray-400 w-50 rounded-[10px] p-1 pl-2 focus:outline-none placeholder:text-[13px]"
              />
            </div>
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => {
                setOpenForm(true);
                navigate("createMeter");
              }}
              className="bg-blue-600"
            >
              Thêm đồng hồ
            </Button>
          </div>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={data}
            pagination={{
              current: pages,
              pageSize: pageSizes,
              total: data?.length,
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

export default Meters;
