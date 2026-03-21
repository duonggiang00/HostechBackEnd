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
    navigate(`/properties/${propertyId}/rooms`);
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
              className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                  {room.name}
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                  room.status === 'occupied' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                  room.status === 'available' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' :
                  room.status === 'maintenance' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {room.status}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2 mt-1">
                <Layout className="w-4 h-4" />
                {room.property_name || 'Property'} • {room.floor_name || room.floor?.name || 'No Floor'} • {room.type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PermissionGate role={['Admin', 'Owner', 'Manager']}>
              <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 p-1.5 rounded-[1.25rem] border border-slate-200 dark:border-slate-800 backdrop-blur-md">
                <button 
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
                >
                  <FileEdit className="w-4 h-4" />
                  Edit Unit
                </button>
                <button 
                  onClick={() => navigate(`/properties/${propertyId}/contracts/create?roomId=${room.id}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-black text-sm hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                  <Zap className="w-4 h-4" />
                  Issue Contract
                </button>
                <button 
                  onClick={handleDelete}
                  className="p-3 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition-all"
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
        className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-6xl border border-white dark:border-slate-800/50 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden min-h-[600px]"
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
            propertyId={propertyId as string}
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
