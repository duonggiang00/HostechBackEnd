// import React from "react";

type Props = {
  title: string;
  value: string;
  growth?: string;
  text?: string;
  type?: "up" | "down" | "neutral";
};

const StatCard: React.FC<Props> = ({ title, value, growth, type = "up" }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
      {/* Title */}
      <p className="text-sm text-gray-500">{title}</p>

      {/* Value */}
      <h2 className="text-2xl font-semibold text-gray-800 mt-2">{value}</h2>

      {/* Growth */}
      {growth && (
        <p
          className={`text-sm mt-2 flex items-center gap-1 ${
            type === "up"
              ? "text-green-500"
              : type === "down"
                ? "text-red-500"
                : "text-gray-400"
          }`}
        >
          {type === "up" && "▲"}
          {type === "down" && "▼"}
          {growth}
        </p>
      )}
    </div>
  );
};

export default StatCard;
