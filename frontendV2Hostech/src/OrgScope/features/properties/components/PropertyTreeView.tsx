import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Building2, Layers, DoorOpen, Plus, MoreVertical, 
  GripVertical
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useScopeStore } from '@/shared/stores/useScopeStore';
import { useProperties } from '@/OrgScope/features/properties/hooks/useProperties';
import { AddFloorModal, AddRoomModal } from './PropertyModals';

interface PropertyNodeProps {
  id: string;
  name: string;
  type: 'property' | 'floor' | 'room';
  children?: PropertyNodeProps[];
  status?: string;
}

// ─── SortableTreeNode ────────────────────────────────────────────────────────
// IMPORTANT: useSensors/useSensor are NOT called here — they must live in
// the parent and be passed as a prop. Calling hooks inside a recursive
// component that renders conditionally violates Rules of Hooks.
const SortableTreeNode = ({ 
  node, 
  depth = 0,
  sensors,
  onAddFloor,
  onAddRoom,
  onReorder,
  onNavigate,
}: { 
  node: PropertyNodeProps; 
  depth?: number;
  sensors: ReturnType<typeof useSensors>;
  onAddFloor?: (node: PropertyNodeProps) => void;
  onAddRoom?: (node: PropertyNodeProps) => void;
  onReorder: (parentId: string, activeId: string, overId: string) => void;
  onNavigate: (propertyId: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const { propertyId, floorId, roomId, setPropertyId, setFloorId, setRoomId } = useScopeStore();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const isSelected = 
    (node.type === 'property' && propertyId === node.id) ||
    (node.type === 'floor' && floorId === node.id) ||
    (node.type === 'room' && roomId === node.id);

  const Icon = node.type === 'property' ? Building2 : node.type === 'floor' ? Layers : DoorOpen;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'property') {
      setPropertyId(node.id);
      // Use React Router navigate (passed as prop) — no full page reload
      onNavigate(node.id);
    }
    if (node.type === 'floor') setFloorId(node.id);
    if (node.type === 'room') setRoomId(node.id);
  };

  const handleChildDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(node.id, active.id as string, over.id as string);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="select-none">
      <div 
        onClick={handleSelect}
        className={`flex items-center group px-3 py-2 rounded-xl cursor-pointer transition-all ${
          isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-slate-50 text-slate-600'
        }`}
        style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button 
            {...attributes} 
            {...listeners}
            className="p-1 -ml-1 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          {node.children && node.children.length > 0 ? (
            <ChevronRight 
              onClick={handleToggle}
              className={`w-4 h-4 transition-transform duration-200 shrink-0 hover:bg-black/10 rounded-md ${isExpanded ? 'rotate-90' : ''}`} 
            />
          ) : (
             <div className="w-4 h-4 shrink-0" />
          )}
          
          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-100' : 'text-slate-400 group-hover:text-indigo-500'}`} />
          
          <span className={`text-sm truncate ${isSelected ? 'font-bold' : 'font-medium'}`}>
            {node.name}
          </span>
          
          {node.status && (
            <div className={`w-2 h-2 rounded-full shrink-0 ml-2 ${
              node.status === 'available' ? 'bg-emerald-400' : 
              node.status === 'occupied' ? 'bg-indigo-400' : 'bg-amber-400'
            }`} />
          )}
        </div>

        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'text-white' : 'text-slate-400'}`}>
          {node.type !== 'room' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (node.type === 'property') onAddFloor?.(node);
                if (node.type === 'floor') onAddRoom?.(node);
              }}
              className="p-1 hover:bg-black/5 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
          <button className="p-1 hover:bg-black/5 rounded-md transition-colors">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Re-use the same sensors from the parent — no new useSensors call here */}
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleChildDragEnd}
            >
              <SortableContext 
                items={node.children.map(child => child.id)}
                strategy={verticalListSortingStrategy}
              >
                {node.children.map(child => (
                  <SortableTreeNode 
                    key={child.id} 
                    node={child} 
                    depth={depth + 1} 
                    sensors={sensors}
                    onAddFloor={onAddFloor}
                    onAddRoom={onAddRoom}
                    onReorder={onReorder}
                    onNavigate={onNavigate}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── PropertyTreeView (root) ─────────────────────────────────────────────────
export default function PropertyTreeView() {
  const navigate = useNavigate();
  const [treeData, setTreeData] = useState<PropertyNodeProps[]>([]);
  const [activeModal, setActiveModal] = useState<{ type: 'floor' | 'room', node: PropertyNodeProps } | null>(null);
  
  const { organizationId } = useScopeStore();
  const { data: properties = [], isLoading } = useProperties({
    'filter[org_id]': organizationId || undefined
  });

  // useSensors lives here — called once per root render, never in a recursive child
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync properties → treeData. Use JSON comparison to avoid infinite loop
  // when the query returns a referentially-new array with the same content.
  const prevPropsRef = React.useRef<string>('');
  React.useEffect(() => {
    const serialized = JSON.stringify(properties.map(p => p.id + p.name));
    if (serialized !== prevPropsRef.current) {
      prevPropsRef.current = serialized;
      setTreeData(
        properties.length > 0
          ? properties.map(p => ({ id: p.id, name: p.name, type: 'property' as const }))
          : []
      );
    }
  }, [properties]);

  const handleReorder = useCallback((parentId: string, activeId: string, overId: string) => {
    const updateNodes = (nodes: PropertyNodeProps[]): PropertyNodeProps[] => {
      return nodes.map(node => {
        if (node.id === parentId && node.children) {
          const oldIndex = node.children.findIndex(c => c.id === activeId);
          const newIndex = node.children.findIndex(c => c.id === overId);
          return {
            ...node,
            children: arrayMove(node.children, oldIndex, newIndex)
          };
        }
        if (node.children) {
          return {
            ...node,
            children: updateNodes(node.children)
          };
        }
        return node;
      });
    };

    const rootOldIndex = treeData.findIndex(n => n.id === activeId);
    const rootNewIndex = treeData.findIndex(n => n.id === overId);
    
    if (rootOldIndex !== -1 && rootNewIndex !== -1) {
      setTreeData(prev => arrayMove(prev, rootOldIndex, rootNewIndex));
    } else {
      setTreeData(prev => updateNodes(prev));
    }
  }, [treeData]);

  const handleRootDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = treeData.findIndex(n => n.id === active.id);
      const newIndex = treeData.findIndex(n => n.id === over.id);
      setTreeData(prev => arrayMove(prev, oldIndex, newIndex));
    }
  };

  // Navigate to /admin/properties/:id/floors after setting property scope
  const handleNavigateToRooms = useCallback((propertyId: string) => {
    navigate(`/admin/properties/${propertyId}/floors`);
  }, [navigate]);

  return (
    <div className="space-y-1">
      <div className="px-4 py-2 flex items-center justify-between mb-2">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Navigator</h3>
        <button className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="px-2">
        {isLoading ? (
          <div className="p-4 text-center text-xs text-slate-400 font-medium">Loading properties...</div>
        ) : treeData.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 font-medium">No properties found.</div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleRootDragEnd}
          >
          <SortableContext
            items={treeData.map(node => node.id)}
            strategy={verticalListSortingStrategy}
          >
            {treeData.map(node => (
              <SortableTreeNode 
                key={node.id} 
                node={node} 
                sensors={sensors}
                onAddFloor={(n) => setActiveModal({ type: 'floor', node: n })}
                onAddRoom={(n) => setActiveModal({ type: 'room', node: n })}
                onReorder={handleReorder}
                onNavigate={handleNavigateToRooms}
              />
            ))}
          </SortableContext>
        </DndContext>
        )}
      </div>

      <AddFloorModal 
        isOpen={activeModal?.type === 'floor'} 
        onClose={() => setActiveModal(null)} 
        propertyName={activeModal?.node.name || ''}
      />

      <AddRoomModal 
        isOpen={activeModal?.type === 'room'} 
        onClose={() => setActiveModal(null)} 
        floorName={activeModal?.node.name || ''}
      />
    </div>
  );
}
