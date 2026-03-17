import React from "react";

interface Props {
  title: string;
  value: string | number;
  change?: string;
}

const StatCard: React.FC<Props> = ({ title, value, change }) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-5">
      <p className="text-sm text-gray-500">{title}</p>

      <h2 className="text-2xl font-bold mt-2 text-gray-800 dark:text-white">
        {value}
      </h2>

      {change && <p className="text-green-500 text-sm mt-1">{change}</p>}
    </div>
  );
};

export default StatCard;
