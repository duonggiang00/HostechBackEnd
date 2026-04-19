import { createBrowserRouter } from "react-router";
import BuildingLayout from "./components/BuildingLayout";
import RoomTemplateDetail from "./components/RoomTemplateDetail";
import RoomTemplateForm from "./components/RoomTemplateForm";
import ServiceForm from "./components/ServiceForm";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: BuildingLayout,
  },
  {
    path: "/room-template/:id",
    Component: RoomTemplateDetail,
  },
  {
    path: "/room-template/:id/edit",
    Component: RoomTemplateForm,
  },
  {
    path: "/service/new",
    Component: ServiceForm,
  },
  {
    path: "/service/:id/edit",
    Component: ServiceForm,
  },
  {
    path: "*",
    element: <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Trang không tìm thấy</p>
    </div>,
  },
]);