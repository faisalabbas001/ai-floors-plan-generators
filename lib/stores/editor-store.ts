import { create } from 'zustand';

export interface RoomDimensions {
  length: number;
  width: number;
}

export type WallSide = 'north' | 'south' | 'east' | 'west';

export interface DoorElement {
  id: string;
  wall: WallSide;
  position: number; // 0-1 percentage along the wall
  width: number; // in pixels
  type: 'single' | 'double' | 'sliding';
  swingDirection?: 'inward' | 'outward';
  swingSide?: 'left' | 'right';
}

export interface WindowElement {
  id: string;
  wall: WallSide;
  position: number; // 0-1 percentage along the wall
  width: number; // in pixels
  type: 'single' | 'double' | 'sliding' | 'bay';
}

export interface Room {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  length: number;
  areaSqft: number;
  color: string;
  features?: string[];
  rotation: number;
  doors?: DoorElement[];
  windows?: WindowElement[];
  furniture?: FurnitureElement[];
}

export interface Floor {
  id: string;
  level: string;
  rooms: Room[];
  texts?: TextElement[];
  totalArea?: number;
}

export interface FloorPlanData {
  buildingType: string;
  totalArea?: number;
  floors: Floor[];
  compliance?: {
    authority?: string;
    setbacks?: {
      front?: number;
      rear?: number;
      sides?: number;
    };
    notes?: string[];
  };
  designNotes?: string[];
}

export type ViewMode = '2d' | '3d' | 'technical';

export type EditorTool = 'select' | 'rectangle' | 'door' | 'window' | 'text' | 'wall' | 'double-door' | 'sliding-door' | 'arch' | 'furniture';

// Furniture types
export interface FurnitureElement {
  id: string;
  type: 'bed' | 'sofa' | 'table' | 'chair' | 'desk' | 'cabinet' | 'wardrobe' | 'toilet' | 'sink' | 'bathtub' | 'shower' | 'stove' | 'fridge';
  x: number; // relative to room
  y: number;
  width: number;
  height: number;
  rotation: number;
}

// Text/Label types
export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontStyle: 'normal' | 'bold' | 'italic';
  fill: string;
  rotation: number;
}

interface EditorState {
  floorPlan: FloorPlanData | null;
  selectedFloorId: string | null;
  selectedRoomId: string | null;
  selectedElementId: string | null; // door or window id
  selectedElementType: 'door' | 'window' | 'text' | null;
  selectedTextId: string | null;
  currentTool: EditorTool;
  viewMode: ViewMode;
  zoom: number;
  gridSnap: boolean;
  showGrid: boolean;
  showLabels: boolean;
  scale: number; // pixels per foot
  wallHeight: number; // in feet for 3D
  history: FloorPlanData[];
  historyIndex: number;

  // Actions
  setFloorPlan: (plan: FloorPlanData) => void;
  loadFromGeneratedPlan: (plan: any) => void;
  selectFloor: (floorId: string | null) => void;
  selectRoom: (roomId: string | null) => void;
  selectElement: (elementId: string | null, elementType: 'door' | 'window' | 'text' | null) => void;
  setCurrentTool: (tool: EditorTool) => void;
  setViewMode: (mode: ViewMode) => void;
  setZoom: (zoom: number) => void;
  toggleGridSnap: () => void;
  toggleShowGrid: () => void;
  toggleShowLabels: () => void;
  setScale: (scale: number) => void;

  // Room operations
  updateRoom: (floorId: string, roomId: string, updates: Partial<Room>) => void;
  moveRoom: (floorId: string, roomId: string, x: number, y: number) => void;
  resizeRoom: (floorId: string, roomId: string, width: number, height: number) => void;
  addRoom: (floorId: string, room: Omit<Room, 'id'>) => void;
  deleteRoom: (floorId: string, roomId: string) => void;

  // Door operations
  addDoor: (floorId: string, roomId: string, door: Omit<DoorElement, 'id'>) => void;
  updateDoor: (floorId: string, roomId: string, doorId: string, updates: Partial<DoorElement>) => void;
  deleteDoor: (floorId: string, roomId: string, doorId: string) => void;

  // Window operations
  addWindow: (floorId: string, roomId: string, window: Omit<WindowElement, 'id'>) => void;
  updateWindow: (floorId: string, roomId: string, windowId: string, updates: Partial<WindowElement>) => void;
  deleteWindow: (floorId: string, roomId: string, windowId: string) => void;

  // Furniture operations
  addFurniture: (floorId: string, roomId: string, furniture: Omit<FurnitureElement, 'id'>) => void;
  updateFurniture: (floorId: string, roomId: string, furnitureId: string, updates: Partial<FurnitureElement>) => void;
  deleteFurniture: (floorId: string, roomId: string, furnitureId: string) => void;

  // Pending furniture type for placement
  pendingFurnitureType: FurnitureElement['type'] | null;
  setPendingFurnitureType: (type: FurnitureElement['type'] | null) => void;

  // Text operations
  addText: (floorId: string, text: Omit<TextElement, 'id'>) => void;
  updateText: (floorId: string, textId: string, updates: Partial<TextElement>) => void;
  deleteText: (floorId: string, textId: string) => void;
  selectText: (textId: string | null) => void;

  // History
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;

  // Export
  exportToJSON: () => string;
  clearEditor: () => void;
}

const ROOM_COLORS: Record<string, string> = {
  bedroom: '#E8D5B7',
  'master bedroom': '#D4C4A8',
  bathroom: '#B8D4E8',
  kitchen: '#FFE4B5',
  'living room': '#C8E6C9',
  'dining room': '#FFCCBC',
  office: '#D1C4E9',
  garage: '#CFD8DC',
  hallway: '#F5F5F5',
  closet: '#EFEBE9',
  laundry: '#B3E5FC',
  default: '#E0E0E0',
};

const getRoomColor = (type: string): string => {
  const normalizedType = type.toLowerCase();
  return ROOM_COLORS[normalizedType] || ROOM_COLORS.default;
};

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useEditorStore = create<EditorState>((set, get) => ({
  floorPlan: null,
  selectedFloorId: null,
  selectedRoomId: null,
  selectedElementId: null,
  selectedElementType: null,
  selectedTextId: null,
  currentTool: 'select',
  viewMode: '2d',
  zoom: 100,
  gridSnap: true,
  showGrid: true,
  showLabels: true,
  scale: 10, // 10 pixels per foot
  wallHeight: 10,
  history: [],
  historyIndex: -1,
  pendingFurnitureType: null,

  setFloorPlan: (plan) => {
    set({ floorPlan: plan, selectedFloorId: plan.floors[0]?.id || null });
    get().saveToHistory();
  },

  loadFromGeneratedPlan: (plan) => {
    const scale = get().scale;
    const padding = 100; // Match preview-2d padding

    // Editor canvas dimensions (approximate)
    const availableWidth = 1000;
    const availableHeight = 700;

    const convertedPlan: FloorPlanData = {
      buildingType: plan.buildingType || 'residential',
      totalArea: plan.totalArea,
      floors: plan.floors.map((floor: any, floorIndex: number) => {
        const rooms = floor.rooms || [];
        if (rooms.length === 0) {
          return {
            id: generateId(),
            level: floor.level,
            rooms: [],
            totalArea: floor.totalArea,
          };
        }

        // Check if AI provided position data
        const hasPositionData = rooms.some((r: any) => r.position && typeof r.position.x === 'number');

        let layoutedRooms: Room[];

        if (hasPositionData) {
          // Use AI-provided positions - calculate building bounds first
          const buildingWidth = plan.buildingDimensions?.width ||
            Math.max(...rooms.map((r: any) => (r.position?.x || 0) + (r.dimensions?.width || 10)));
          const buildingDepth = plan.buildingDimensions?.depth ||
            Math.max(...rooms.map((r: any) => (r.position?.y || 0) + (r.dimensions?.length || 10)));

          // Calculate scale to fit the available space (matching preview-2d logic)
          const scaleX = availableWidth / buildingWidth;
          const scaleY = availableHeight / buildingDepth;
          const layoutScale = Math.min(scaleX, scaleY) * 0.8;

          const scaledWidth = buildingWidth * layoutScale;
          const scaledHeight = buildingDepth * layoutScale;
          const offsetX = padding + (availableWidth - scaledWidth) / 2;
          const offsetY = padding + (availableHeight - scaledHeight) / 2 + floorIndex * 600;

          layoutedRooms = rooms.map((room: any) => {
            const length = room.dimensions?.length || Math.sqrt(room.areaSqft || 150);
            const width = room.dimensions?.width || Math.sqrt(room.areaSqft || 150);
            const areaSqft = room.areaSqft || length * width;

            return {
              id: room.id || generateId(),
              name: room.name,
              type: room.type || room.name.toLowerCase(),
              x: offsetX + (room.position?.x || 0) * layoutScale,
              y: offsetY + (room.position?.y || 0) * layoutScale,
              width: width * layoutScale,
              height: length * layoutScale,
              length: length,
              areaSqft: areaSqft,
              color: getRoomColor(room.type || room.name),
              features: room.features || [],
              rotation: 0,
            };
          });
        } else {
          // Fallback grid layout - EXACTLY matching preview-2d logic
          const totalArea = rooms.reduce((sum: number, r: any) => sum + (r.areaSqft || 100), 0);
          const scaleFactor = Math.sqrt((availableWidth * availableHeight * 0.55) / totalArea);
          const cols = Math.ceil(Math.sqrt(rooms.length));

          // Calculate room sizes
          const roomsWithSize = rooms.map((room: any) => {
            const area = (room.areaSqft || 100) * scaleFactor * scaleFactor;
            let rw: number, rh: number;
            if (room.dimensions) {
              rw = room.dimensions.width * scaleFactor;
              rh = room.dimensions.length * scaleFactor;
            } else {
              const ratio = 1.2;
              rw = Math.sqrt(area * ratio);
              rh = area / rw;
            }
            return {
              ...room,
              calculatedWidth: Math.max(rw, 70),
              calculatedHeight: Math.max(rh, 60),
              length: room.dimensions?.length || Math.sqrt(room.areaSqft || 100),
            };
          });

          // Build rows
          const rows: Array<{ rooms: typeof roomsWithSize; height: number }> = [];
          let currentRow: typeof roomsWithSize = [];
          let totalW = 0, totalH = 0;

          roomsWithSize.forEach((room: any) => {
            if (currentRow.length >= cols) {
              const rowH = Math.max(...currentRow.map((r: any) => r.calculatedHeight));
              rows.push({ rooms: currentRow, height: rowH });
              totalW = Math.max(totalW, currentRow.reduce((sum: number, r: any) => sum + r.calculatedWidth, 0));
              totalH += rowH;
              currentRow = [];
            }
            currentRow.push(room);
          });
          if (currentRow.length > 0) {
            const rowH = Math.max(...currentRow.map((r: any) => r.calculatedHeight));
            rows.push({ rooms: currentRow, height: rowH });
            totalW = Math.max(totalW, currentRow.reduce((sum: number, r: any) => sum + r.calculatedWidth, 0));
            totalH += rowH;
          }

          // Calculate offsets to center the layout
          const offsetX = padding + (availableWidth - totalW) / 2;
          const offsetY = padding + (availableHeight - totalH) / 2 + floorIndex * 600;

          // Layout rooms in rows
          layoutedRooms = [];
          let currentY = offsetY;

          rows.forEach(({ rooms: rowRooms, height: rowH }) => {
            const rowW = rowRooms.reduce((sum: number, r: any) => sum + r.calculatedWidth, 0);
            let currentX = offsetX + (totalW - rowW) / 2;

            rowRooms.forEach((room: any) => {
              layoutedRooms.push({
                id: room.id || generateId(),
                name: room.name,
                type: room.type || room.name.toLowerCase(),
                x: currentX,
                y: currentY,
                width: room.calculatedWidth,
                height: rowH, // All rooms in a row have same height
                length: room.length,
                areaSqft: room.areaSqft || 100,
                color: getRoomColor(room.type || room.name),
                features: room.features || [],
                rotation: 0,
              });
              currentX += room.calculatedWidth;
            });
            currentY += rowH;
          });
        }

        return {
          id: generateId(),
          level: floor.level,
          rooms: layoutedRooms,
          totalArea: floor.totalArea,
        };
      }),
      compliance: plan.compliance,
      designNotes: plan.designNotes,
    };

    set({
      floorPlan: convertedPlan,
      selectedFloorId: convertedPlan.floors[0]?.id || null,
      selectedRoomId: null,
    });
    get().saveToHistory();
  },

  selectFloor: (floorId) => set({ selectedFloorId: floorId, selectedRoomId: null }),

  selectRoom: (roomId) => set({ selectedRoomId: roomId, selectedElementId: null, selectedElementType: null }),

  selectElement: (elementId, elementType) => set({
    selectedElementId: elementId,
    selectedElementType: elementType,
    selectedRoomId: elementType ? get().selectedRoomId : null
  }),

  setCurrentTool: (tool) => set({ currentTool: tool }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setZoom: (zoom) => set({ zoom: Math.max(25, Math.min(200, zoom)) }),

  toggleGridSnap: () => set((state) => ({ gridSnap: !state.gridSnap })),

  toggleShowGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  toggleShowLabels: () => set((state) => ({ showLabels: !state.showLabels })),

  setScale: (scale) => set({ scale }),

  updateRoom: (floorId, roomId, updates) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            rooms: floor.rooms.map((room) => {
              if (room.id !== roomId) return room;
              return { ...room, ...updates };
            }),
          };
        }),
      };

      return { floorPlan: newFloorPlan };
    });
    get().saveToHistory();
  },

  moveRoom: (floorId, roomId, x, y) => {
    const { gridSnap } = get();
    const snapValue = gridSnap ? 10 : 1;
    const snappedX = Math.round(x / snapValue) * snapValue;
    const snappedY = Math.round(y / snapValue) * snapValue;

    get().updateRoom(floorId, roomId, { x: snappedX, y: snappedY });
  },

  resizeRoom: (floorId, roomId, width, height) => {
    const { scale } = get();
    const newLength = height / scale;
    const newWidth = width / scale;
    const newArea = newLength * newWidth;

    get().updateRoom(floorId, roomId, {
      width,
      height,
      length: newLength,
      areaSqft: Math.round(newArea),
    });
  },

  addRoom: (floorId, room) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newRoom: Room = {
        ...room,
        id: generateId(),
      };

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            rooms: [...floor.rooms, newRoom],
          };
        }),
      };

      return { floorPlan: newFloorPlan };
    });
    get().saveToHistory();
  },

  deleteRoom: (floorId, roomId) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            rooms: floor.rooms.filter((room) => room.id !== roomId),
          };
        }),
      };

      return {
        floorPlan: newFloorPlan,
        selectedRoomId: state.selectedRoomId === roomId ? null : state.selectedRoomId,
      };
    });
    get().saveToHistory();
  },

  // Door operations
  addDoor: (floorId, roomId, door) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newDoor: DoorElement = {
        ...door,
        id: generateId(),
      };

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            rooms: floor.rooms.map((room) => {
              if (room.id !== roomId) return room;
              return {
                ...room,
                doors: [...(room.doors || []), newDoor],
              };
            }),
          };
        }),
      };

      return { floorPlan: newFloorPlan, selectedElementId: newDoor.id, selectedElementType: 'door' as const };
    });
    get().saveToHistory();
  },

  updateDoor: (floorId, roomId, doorId, updates) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            rooms: floor.rooms.map((room) => {
              if (room.id !== roomId) return room;
              return {
                ...room,
                doors: (room.doors || []).map((door) => {
                  if (door.id !== doorId) return door;
                  return { ...door, ...updates };
                }),
              };
            }),
          };
        }),
      };

      return { floorPlan: newFloorPlan };
    });
    get().saveToHistory();
  },

  deleteDoor: (floorId, roomId, doorId) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            rooms: floor.rooms.map((room) => {
              if (room.id !== roomId) return room;
              return {
                ...room,
                doors: (room.doors || []).filter((door) => door.id !== doorId),
              };
            }),
          };
        }),
      };

      return {
        floorPlan: newFloorPlan,
        selectedElementId: state.selectedElementId === doorId ? null : state.selectedElementId,
        selectedElementType: state.selectedElementId === doorId ? null : state.selectedElementType,
      };
    });
    get().saveToHistory();
  },

  // Window operations
  addWindow: (floorId, roomId, windowData) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newWindow: WindowElement = {
        ...windowData,
        id: generateId(),
      };

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            rooms: floor.rooms.map((room) => {
              if (room.id !== roomId) return room;
              return {
                ...room,
                windows: [...(room.windows || []), newWindow],
              };
            }),
          };
        }),
      };

      return { floorPlan: newFloorPlan, selectedElementId: newWindow.id, selectedElementType: 'window' as const };
    });
    get().saveToHistory();
  },

  updateWindow: (floorId, roomId, windowId, updates) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            rooms: floor.rooms.map((room) => {
              if (room.id !== roomId) return room;
              return {
                ...room,
                windows: (room.windows || []).map((win) => {
                  if (win.id !== windowId) return win;
                  return { ...win, ...updates };
                }),
              };
            }),
          };
        }),
      };

      return { floorPlan: newFloorPlan };
    });
    get().saveToHistory();
  },

  deleteWindow: (floorId, roomId, windowId) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            rooms: floor.rooms.map((room) => {
              if (room.id !== roomId) return room;
              return {
                ...room,
                windows: (room.windows || []).filter((win) => win.id !== windowId),
              };
            }),
          };
        }),
      };

      return {
        floorPlan: newFloorPlan,
        selectedElementId: state.selectedElementId === windowId ? null : state.selectedElementId,
        selectedElementType: state.selectedElementId === windowId ? null : state.selectedElementType,
      };
    });
    get().saveToHistory();
  },

  // Furniture operations
  setPendingFurnitureType: (type) => set({ pendingFurnitureType: type }),

  addFurniture: (floorId, roomId, furniture) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newFurniture: FurnitureElement = {
        ...furniture,
        id: generateId(),
      };

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            rooms: floor.rooms.map((room) => {
              if (room.id !== roomId) return room;
              return {
                ...room,
                furniture: [...(room.furniture || []), newFurniture],
              };
            }),
          };
        }),
      };

      return { floorPlan: newFloorPlan, selectedElementId: newFurniture.id, selectedElementType: null };
    });
    get().saveToHistory();
  },

  updateFurniture: (floorId, roomId, furnitureId, updates) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            rooms: floor.rooms.map((room) => {
              if (room.id !== roomId) return room;
              return {
                ...room,
                furniture: (room.furniture || []).map((furn) => {
                  if (furn.id !== furnitureId) return furn;
                  return { ...furn, ...updates };
                }),
              };
            }),
          };
        }),
      };

      return { floorPlan: newFloorPlan };
    });
    get().saveToHistory();
  },

  deleteFurniture: (floorId, roomId, furnitureId) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            rooms: floor.rooms.map((room) => {
              if (room.id !== roomId) return room;
              return {
                ...room,
                furniture: (room.furniture || []).filter((furn) => furn.id !== furnitureId),
              };
            }),
          };
        }),
      };

      return {
        floorPlan: newFloorPlan,
        selectedElementId: state.selectedElementId === furnitureId ? null : state.selectedElementId,
      };
    });
    get().saveToHistory();
  },

  // Text operations
  selectText: (textId) => set({
    selectedTextId: textId,
    selectedElementId: textId,
    selectedElementType: textId ? 'text' : null,
    selectedRoomId: null,
  }),

  addText: (floorId, textData) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newText: TextElement = {
        ...textData,
        id: generateId(),
      };

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            texts: [...(floor.texts || []), newText],
          };
        }),
      };

      return {
        floorPlan: newFloorPlan,
        selectedTextId: newText.id,
        selectedElementId: newText.id,
        selectedElementType: 'text' as const,
      };
    });
    get().saveToHistory();
  },

  updateText: (floorId, textId, updates) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            texts: (floor.texts || []).map((text) => {
              if (text.id !== textId) return text;
              return { ...text, ...updates };
            }),
          };
        }),
      };

      return { floorPlan: newFloorPlan };
    });
    get().saveToHistory();
  },

  deleteText: (floorId, textId) => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newFloorPlan = {
        ...state.floorPlan,
        floors: state.floorPlan.floors.map((floor) => {
          if (floor.id !== floorId) return floor;
          return {
            ...floor,
            texts: (floor.texts || []).filter((text) => text.id !== textId),
          };
        }),
      };

      return {
        floorPlan: newFloorPlan,
        selectedTextId: state.selectedTextId === textId ? null : state.selectedTextId,
        selectedElementId: state.selectedElementId === textId ? null : state.selectedElementId,
        selectedElementType: state.selectedElementId === textId ? null : state.selectedElementType,
      };
    });
    get().saveToHistory();
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        floorPlan: state.history[newIndex],
        historyIndex: newIndex,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        floorPlan: state.history[newIndex],
        historyIndex: newIndex,
      };
    });
  },

  saveToHistory: () => {
    set((state) => {
      if (!state.floorPlan) return state;

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(state.floorPlan)));

      if (newHistory.length > 50) {
        newHistory.shift();
      }

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  },

  exportToJSON: () => {
    const { floorPlan } = get();
    if (!floorPlan) return '{}';

    const exportData = {
      buildingType: floorPlan.buildingType,
      totalArea: floorPlan.totalArea,
      floors: floorPlan.floors.map((floor) => ({
        level: floor.level,
        totalArea: floor.totalArea,
        rooms: floor.rooms.map((room) => ({
          name: room.name,
          type: room.type,
          areaSqft: room.areaSqft,
          length: room.length,
          width: room.width / (get().scale || 10),
          features: room.features,
        })),
      })),
      compliance: floorPlan.compliance,
      designNotes: floorPlan.designNotes,
    };

    return JSON.stringify(exportData, null, 2);
  },

  clearEditor: () => {
    set({
      floorPlan: null,
      selectedFloorId: null,
      selectedRoomId: null,
      history: [],
      historyIndex: -1,
    });
  },
}));
