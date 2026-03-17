import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { vi } from "date-fns/locale/vi";

import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: any) => startOfWeek(date, { locale: vi }),
  getDay,
  locales: {
    vi: vi,
  },
});

const events = [
  {
    title: "Thanh toán tiền phòng",
    start: new Date(),
    end: new Date(),
  },
];

const CalendarWidget = () => {
  return (
    <div className="bg-white shadow rounded-2xl p-5 h-[520px] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">Lịch công việc</h3>
        <span className="text-sm text-gray-400">Tháng này</span>
      </div>

      {/* Calendar */}
      <div className="flex-1">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          culture="vi"
          style={{ height: "100%" }}
        />
      </div>
    </div>
  );
};

export default CalendarWidget;
