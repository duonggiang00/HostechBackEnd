import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
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
    <div className="bg-white shadow rounded-xl p-5 h-[500px]">
      <h3 className="font-semibold mb-4">Lịch</h3>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
      />
    </div>
  );
};

export default CalendarWidget;
