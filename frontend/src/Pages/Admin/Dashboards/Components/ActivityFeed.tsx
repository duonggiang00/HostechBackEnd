const ActivityFeed = () => {
  const activities = [
    "Thanh toán tiền phòng",
    "Người thuê mới đăng ký",
    "Yêu cầu sửa chữa",
    "Gia hạn hợp đồng",
  ];

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5">
      <h3 className="font-semibold mb-4">Hoạt động gần đây</h3>

      <div className="space-y-3 text-sm">
        {activities.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span>{item}</span>
            <span className="text-gray-400">{i + 1} giờ trước</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
