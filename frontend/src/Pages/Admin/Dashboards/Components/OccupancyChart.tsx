import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Đã thuê", value: 96 },
  { name: "Phòng trống", value: 32 },
];

const OccupancyChart = () => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 h-80">
      <h3 className="font-semibold mb-4">Tình trạng phòng</h3>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" outerRadius={100} />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OccupancyChart;
