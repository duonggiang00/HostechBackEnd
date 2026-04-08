import { useState } from "react";
import { Building, List, Grid3x3 } from "lucide-react";
import BuildingDetails from "./BuildingDetails";
import ServiceList from "./ServiceList";
import RoomTemplateList from "./RoomTemplateList";

type TabType = "details" | "services" | "rooms";

export default function BuildingLayout() {
  const [activeTab, setActiveTab] = useState<TabType>("details");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Quản lý Tòa nhà</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex items-center gap-2 px-1 py-4 border-b-2 transition-colors ${
                activeTab === "details"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <Building className="w-5 h-5" />
              <span className="font-medium">Chi tiết tòa nhà</span>
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`flex items-center gap-2 px-1 py-4 border-b-2 transition-colors ${
                activeTab === "services"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <List className="w-5 h-5" />
              <span className="font-medium">Danh sách dịch vụ</span>
            </button>
            <button
              onClick={() => setActiveTab("rooms")}
              className={`flex items-center gap-2 px-1 py-4 border-b-2 transition-colors ${
                activeTab === "rooms"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
              <span className="font-medium">Danh sách phòng mẫu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "details" && <BuildingDetails />}
        {activeTab === "services" && <ServiceList />}
        {activeTab === "rooms" && <RoomTemplateList />}
      </div>
    </div>
  );
}
