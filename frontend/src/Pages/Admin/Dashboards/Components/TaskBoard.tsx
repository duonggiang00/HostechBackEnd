const TaskBoard = () => {
  const tasks = [
    "Kiểm tra phòng 203",
    "Xử lý yêu cầu sửa điện",
    "Gia hạn hợp đồng phòng 105",
  ];

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5">
      <h3 className="font-semibold mb-4">Công việc hôm nay</h3>

      <ul className="space-y-3">
        {tasks.map((task, i) => (
          <li key={i} className="flex gap-2">
            <input type="checkbox" />
            {task}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskBoard;
