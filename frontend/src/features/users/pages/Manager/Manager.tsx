import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router";
import { Eye, Plus } from "lucide-react";
import { Table, Button, Tooltip } from "antd";
import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../../api/userApi";

const Manager = () => {
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", "managers"],
    queryFn: () => getUsers({ role: "MANAGER" }),
  });

  const managerColumns = [
    {
      title: "Tên quản lý",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
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
                navigate(`detailManager/${record.id}`);
              }}
              style={{
                backgroundColor: "#22c55e",
                borderColor: "#22c55e",
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
          <div className="flex item-center justify-between border p-2 border-gray-300 rounded-[10px]">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] pl-2 font-bold">Tên quản lý</label>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên quản lý..."
                className="border border-gray-400 w-50 rounded-[10px] p-1 pl-2 focus:outline-none placeholder:text-[13px]"
              />
            </div>
            <Link to="createManager" onClick={() => setOpenForm(true)}>
              <div className="flex items-center h-10 mt-2 pl-2 pr-2 w-content rounded-[10px] gap-1 bg-blue-400 p-1 text-black/60 font-semibold hover:text-white hover:font-bold cursor-pointer">
                <Plus className="w-5" /> thêm quản lý
              </div>
            </Link>
          </div>
          <Table
            rowKey="id"
            columns={managerColumns}
            dataSource={(users as any)?.data ?? users ?? []}
            loading={isLoading}
            pagination={{
              pageSize: 10,
            }}
          />
        </section>
      ) : (
        <Outlet />
      )}
    </>
  );
};

export default Manager;
