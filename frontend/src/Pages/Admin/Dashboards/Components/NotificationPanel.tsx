const NotificationPanel = () => {
  const notifications = [
    "Có yêu cầu sửa chữa mới",
    "Người thuê mới đăng ký",
    "Hóa đơn tháng đã tạo",
  ];

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5">
      <h3 className="font-semibold mb-4">Thông báo</h3>

      <ul className="space-y-2 text-sm">
        {notifications.map((n, i) => (
          <li key={i} className="text-gray-600 dark:text-gray-300">
            {n}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationPanel;
