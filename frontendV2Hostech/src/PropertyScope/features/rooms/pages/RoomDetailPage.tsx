import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronLeft, FileEdit, Trash2, Zap, Layout } from 'lucide-react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useRoomDetail, useRoomActions } from '../hooks/useRooms';
import RoomDetailContent from '../components/RoomDetailContent';
import ManagementModal from '@/shared/features/management/components/ManagementModal';
import RoomForm from '../components/RoomForm';
import ContractWizard from '@/PropertyScope/features/contracts/components/ContractWizard';
import { PermissionGate } from '@/shared/features/auth/components/PermissionGate';

export default function RoomDetailPage() {
  const { propertyId, roomId } = useParams<{ propertyId: string; roomId: string }>();
  const navigate = useNavigate();
  const { data: room, isLoading, error, refetch } = useRoomDetail(roomId);
  const { deleteRoom } = useRoomActions();
  
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [managementMode, setManagementMode] = useState<'edit' | 'contract' | 'individual' | 'quick'>('edit');

  const handleBack = () => {
    navigate(`/org/properties/${propertyId}/rooms`);
  };

  const handleEdit = () => {
    setManagementMode('edit');
    setIsManagementOpen(true);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete room ${room?.name}?`)) {
      await deleteRoom.mutateAsync(roomId as string);
      handleBack();
    }
  };

  const handleOpenManagement = (mode: string) => {
    setManagementMode(mode as any);
    setIsManagementOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="p-12 text-center text-rose-500 bg-rose-50 border border-rose-100 rounded-3xl m-8">
        <h3 className="text-xl font-bold mb-2">Error Loading Room</h3>
        <p>{(error as any)?.message || 'Room not found or access denied.'}</p>
        <button onClick={handleBack} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl">
          Back to Rooms
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-900 leading-tight">
                  {room.name}
                </h1>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  room.status === 'occupied' ? 'bg-emerald-100 text-emerald-700' :
                  room.status === 'available' ? 'bg-indigo-100 text-indigo-700' :
                  room.status === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {room.status}
                </span>
              </div>
              <p className="text-slate-500 font-bold flex items-center gap-2 mt-1">
                <Layout className="w-4 h-4" />
                {room.property_name || 'Property'} • {room.floor_name || room.floor?.name || 'No Floor'} • {room.type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PermissionGate role={['Admin', 'Owner', 'Manager']}>
              <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-[1.25rem] border border-slate-200 backdrop-blur-sm">
                <button 
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-black text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm"
                >
                  <FileEdit className="w-4 h-4" />
                  Edit Unit
                </button>
                <button 
                  onClick={() => handleOpenManagement('contract')}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Zap className="w-4 h-4" />
                  Issue Contract
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title="Delete Room"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </PermissionGate>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-[3rem] border border-white shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[600px]"
      >
        <RoomDetailContent 
          room={room}
          propertyId={propertyId as string}
          onClose={() => {}} // No-op in full page mode
          onOpenManagement={handleOpenManagement}
          isFullPage
        />
      </motion.div>

      {/* Management Modals */}
      <ManagementModal 
        isOpen={isManagementOpen}
        onClose={() => setIsManagementOpen(false)}
        roomName={room.name}
        title={
          managementMode === 'edit' ? `Manage ${room.name}` :
          managementMode === 'quick' ? 'Batch Unit Creation' : 
          managementMode === 'contract' ? `Create Contract for ${room.name}` : 'New Unit Details'
        }
      >
        {managementMode === 'edit' && (
          <RoomForm 
            initialData={room}
            propertyId={propertyId as string}
            floorId={room.floor_id || undefined}
            onSuccess={() => {
              setIsManagementOpen(false);
              refetch();
            }}
            onCancel={() => setIsManagementOpen(false)}
          />
        )}
        {managementMode === 'contract' && (
          <ContractWizard 
            roomId={room.id}
            onSuccess={() => {
              setIsManagementOpen(false);
              refetch();
            }}
            onCancel={() => setIsManagementOpen(false)}
          />
        )}
      </ManagementModal>
    </div>
  );
}
