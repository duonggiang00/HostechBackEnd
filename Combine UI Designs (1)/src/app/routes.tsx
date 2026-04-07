import { createBrowserRouter } from "react-router";
import { HomePage } from "./pages/HomePage";
import { RoomDetail } from "./pages/RoomDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomePage,
  },
  {
    path: "/room/:roomId",
    Component: RoomDetail,
  },
]);