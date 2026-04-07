import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Minus, Eye, Pencil, Trash2 } from 'lucide-react';

interface Room {
  id: string;
  number: string;
  floor: number;
  col: number;
}

interface Floor {
  floor: number;
  rooms: Room[];
}

interface BuildingOverviewProps {
  onRoomSelect: (room: Room | null) => void;
  selectedRoom: Room | null;
}

export function BuildingOverview({ onRoomSelect, selectedRoom }: BuildingOverviewProps) {
  const navigate = useNavigate();
  const [floors, setFloors] = useState<Floor[]>([
    {
      floor: 1,
      rooms: [
        { id: '101', number: '101', floor: 1, col: 0 },
        { id: '102', number: '102', floor: 1, col: 1 },
        { id: '103', number: '103', floor: 1, col: 2 },
        { id: '104', number: '104', floor: 1, col: 3 },
      ],
    },
    {
      floor: 2,
      rooms: [
        { id: '201', number: '201', floor: 2, col: 0 },
        { id: '202', number: '202', floor: 2, col: 1 },
        { id: '203', number: '203', floor: 2, col: 2 },
        { id: '204', number: '204', floor: 2, col: 3 },
      ],
    },
    {
      floor: 3,
      rooms: [
        { id: '301', number: '301', floor: 3, col: 0 },
        { id: '302', number: '302', floor: 3, col: 1 },
        { id: '303', number: '303', floor: 3, col: 2 },
        { id: '304', number: '304', floor: 3, col: 3 },
      ],
    },
    {
      floor: 4,
      rooms: [
        { id: '401', number: '401', floor: 4, col: 0 },
        { id: '402', number: '402', floor: 4, col: 1 },
        { id: '403', number: '403', floor: 4, col: 2 },
        { id: '404', number: '404', floor: 4, col: 3 },
      ],
    },
  ]);
  const [hoveredDivider, setHoveredDivider] = useState<number | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [hoveredFloorAdd, setHoveredFloorAdd] = useState<number | null>(null);

  // Calculate max columns for grid
  const maxColumns = Math.max(...floors.map(f => f.rooms.length));

  const handleAddFloor = () => {
    const newFloorNumber = floors.length + 1;
    const newFloor: Floor = {
      floor: newFloorNumber,
      rooms: [],
    };
    setFloors([...floors, newFloor]);
  };

  const handleRemoveFloor = () => {
    if (floors.length > 1) {
      setFloors(floors.slice(0, -1));
    }
  };

  const handleAddRoom = (floorNumber: number) => {
    setFloors(floors.map(floor => {
      if (floor.floor === floorNumber) {
        const nextRoomNumber = floor.rooms.length + 1;
        const newRoom: Room = {
          id: `${floorNumber}0${nextRoomNumber}`,
          number: `${floorNumber}0${nextRoomNumber}`,
          floor: floorNumber,
          col: floor.rooms.length,
        };
        return {
          ...floor,
          rooms: [...floor.rooms, newRoom],
        };
      }
      return floor;
    }));
  };

  const handleRemoveRoom = (roomId: string) => {
    setFloors(floors.map(floor => ({
      ...floor,
      rooms: floor.rooms.filter(room => room.id !== roomId),
    })));
    if (selectedRoom?.id === roomId) {
      onRoomSelect(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-5xl w-full">
        {/* Building visualization */}
        <div className="relative">
          {/* Floors */}
          <div className="border-4 border-gray-300 bg-white rounded-sm shadow-lg">
            {/* Top divider with plus button */}
            <div 
              className="relative h-4 bg-gray-200 border-b-2 border-gray-300 hover:bg-blue-100 transition-colors cursor-pointer flex items-center justify-center group"
              onMouseEnter={() => setHoveredDivider(-1)}
              onMouseLeave={() => setHoveredDivider(null)}
              onClick={handleAddFloor}
            >
              {hoveredDivider === -1 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-green-500 text-white rounded-full p-1 shadow-lg">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>

            {floors.slice().reverse().map((floorData, index) => (
              <div key={floorData.floor}>
                <div className="flex">
                  {/* Floor label */}
                  <div className="w-24 flex items-center justify-center bg-gray-100 border-r-2 border-gray-200 py-8">
                    <span className="text-gray-700 text-lg">Floor {floorData.floor}</span>
                  </div>

                  {/* Rooms */}
                  <div className="flex-1 flex items-center p-4 relative h-40">
                    <div 
                      className="grid gap-4" 
                      style={{ 
                        gridTemplateColumns: `repeat(${Math.min(floorData.rooms.length + 1, maxColumns + 1)}, 1fr)`,
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      {floorData.rooms.map((room) => (
                        <div 
                          key={room.id} 
                          className="relative group/room h-full"
                          onMouseEnter={() => setHoveredRoom(room.id)}
                          onMouseLeave={() => setHoveredRoom(null)}
                        >
                          <button
                            onClick={() => onRoomSelect(room)}
                            className={`w-full h-full rounded-lg border-2 flex items-center justify-center transition-all ${
                              selectedRoom?.id === room.id
                                ? 'bg-blue-500 border-blue-600 scale-105 text-white shadow-lg'
                                : 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-400 text-blue-900'
                            }`}
                          >
                            <span className="text-xl">{room.number}</span>
                          </button>
                          
                          {/* Action buttons on hover */}
                          {hoveredRoom === room.id && (
                            <div className="absolute top-2 right-2 flex gap-1 z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/room/${room.id}`);
                                }}
                                className="bg-blue-600 text-white p-1.5 rounded-md shadow-lg hover:bg-blue-700 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Edit action
                                }}
                                className="bg-yellow-500 text-white p-1.5 rounded-md shadow-lg hover:bg-yellow-600 transition-colors"
                                title="Edit Room"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveRoom(room.id);
                                }}
                                className="bg-red-500 text-white p-1.5 rounded-md shadow-lg hover:bg-red-600 transition-colors"
                                title="Delete Room"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Add room button - positioned in grid after last room */}
                      {floorData.rooms.length < maxColumns + 1 && (
                        <div 
                          className="h-full flex items-center justify-center cursor-pointer"
                          onMouseEnter={() => setHoveredFloorAdd(floorData.floor)}
                          onMouseLeave={() => setHoveredFloorAdd(null)}
                          onClick={() => handleAddRoom(floorData.floor)}
                        >
                          {hoveredFloorAdd === floorData.floor ? (
                            <div className="bg-green-500 text-white rounded-full p-3 shadow-lg hover:bg-green-600 transition-colors">
                              <Plus className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg w-full h-full flex items-center justify-center">
                              <Plus className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider between floors with minus button */}
                {index < floors.length - 1 && (
                  <div 
                    className="relative h-4 bg-gray-200 border-y-2 border-gray-300 hover:bg-red-100 transition-colors cursor-pointer flex items-center justify-center group"
                    onMouseEnter={() => setHoveredDivider(index)}
                    onMouseLeave={() => setHoveredDivider(null)}
                    onClick={handleRemoveFloor}
                  >
                    {hoveredDivider === index && floors.length > 1 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-500 text-white rounded-full p-1 shadow-lg">
                          <Minus className="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}