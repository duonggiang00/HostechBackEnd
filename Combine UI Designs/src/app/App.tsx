import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BuildingOverview } from './components/BuildingOverview';
import { RoomDetailsPanel } from './components/RoomDetailsPanel';

interface Room {
  id: string;
  number: string;
  floor: number;
}

export default function App() {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Area */}
        <div className="flex-1 flex flex-col">
          {/* Title Section */}
          <div className="bg-white px-8 py-6 border-b border-gray-200 shadow-sm">
            <h1 className="text-gray-900 text-3xl mb-1">METRO TOWER</h1>
            <p className="text-gray-600 text-sm">INTEGRATED B.M.S.</p>
            <div className="flex gap-2 mt-4">
              <button className="px-6 py-2 bg-blue-500 text-white rounded-full shadow-sm hover:bg-blue-600 transition-colors">
                Section View
              </button>
              <button className="px-6 py-2 text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                Dashboard
              </button>
            </div>
          </div>

          {/* Building View */}
          <div className="flex-1 flex">
            <BuildingOverview 
              onRoomSelect={setSelectedRoom}
              selectedRoom={selectedRoom}
            />

            {/* Room Details Panel */}
            {selectedRoom && (
              <RoomDetailsPanel 
                room={selectedRoom}
                onClose={() => setSelectedRoom(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}