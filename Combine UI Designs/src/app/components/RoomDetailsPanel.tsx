import { X } from 'lucide-react';

interface Room {
  id: string;
  number: string;
  floor: number;
}

interface RoomDetailsPanelProps {
  room: Room | null;
  onClose: () => void;
}

const roomData: Record<string, {
  tenant: string;
  contact: string;
  leaseStart: string;
  leaseEnd: string;
  maintenanceStatus: string;
  recentActivity: string;
}> = {
  '201': {
    tenant: 'Jaman Narton',
    contact: '+91 (703) 357-7890',
    leaseStart: '06/28/2022',
    leaseEnd: '06/28/2022',
    maintenanceStatus: 'Maintenance',
    recentActivity: 'Recent activity is sceitarly activity.',
  },
  '101': {
    tenant: 'Sarah Johnson',
    contact: '+1 (555) 123-4567',
    leaseStart: '01/15/2023',
    leaseEnd: '01/15/2024',
    maintenanceStatus: 'Active',
    recentActivity: 'No recent maintenance required.',
  },
};

export function RoomDetailsPanel({ room, onClose }: RoomDetailsPanelProps) {
  if (!room) return null;

  const details = roomData[room.number] || roomData['201'];

  return (
    <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col gap-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h2 className="text-gray-900 text-xl">Room Details</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Room Number */}
      <div>
        <h3 className="text-gray-900 text-2xl mb-4">Room {room.number}</h3>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-gray-500 text-sm mb-1">Tenant Name</div>
          <div className="text-gray-900">{details.tenant}</div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="text-gray-500 text-sm mb-1">Contact Info</div>
          <div className="text-gray-900">{details.contact}</div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="text-gray-500 text-sm mb-1">Lease Start</div>
          <div className="text-gray-900">{details.leaseStart}</div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="text-gray-500 text-sm mb-1">Lease End</div>
          <div className="text-gray-900">{details.leaseEnd}</div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="text-gray-500 text-sm mb-1">Maintenance Status</div>
          <div className="text-gray-900">{details.maintenanceStatus}</div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="text-gray-500 text-sm mb-1">Recent Activity</div>
          <div className="text-gray-900">{details.recentActivity}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-4">
        <button className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
          Edit Details
        </button>
        <button className="w-full py-3 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
          Contact Tenant
        </button>
        <button className="w-full py-3 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
          Create Maintenance Ticket
        </button>
      </div>
    </div>
  );
}