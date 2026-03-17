import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", revenue: 4000 },
  { month: "Feb", revenue: 3000 },
  { month: "Mar", revenue: 5000 },
  { month: "Apr", revenue: 7000 },
  { month: "May", revenue: 6000 },
  { month: "Jun", revenue: 8000 },
];

const RevenueChart = () => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5 h-80">
      <h3 className="font-semibold mb-4">Doanh thu 6 tháng</h3>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <Tooltip />
          <Line type="monotone" dataKey="revenue" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
