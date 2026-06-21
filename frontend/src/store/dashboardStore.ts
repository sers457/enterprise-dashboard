import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DashboardWidget } from '@/types';

interface DashboardStore {
  widgets: DashboardWidget[];
  layout: Record<string, { x: number; y: number; w: number; h: number }>;
  isEditing: boolean;
  addWidget: (widget: DashboardWidget) => void;
  removeWidget: (id: string) => void;
  reorderWidgets: (widgets: DashboardWidget[]) => void;
  updateWidget: (id: string, updates: Partial<DashboardWidget>) => void;
  toggleEditing: () => void;
  setLayout: (id: string, layout: { x: number; y: number; w: number; h: number }) => void;
  resetLayout: () => void;
}

const defaultWidgets: DashboardWidget[] = [
  { id: 'revenue', type: 'kpi', title: 'Revenue', size: 'sm', position: { x: 0, y: 0 }, visible: true },
  { id: 'users', type: 'kpi', title: 'Active Users', size: 'sm', position: { x: 1, y: 0 }, visible: true },
  { id: 'growth', type: 'kpi', title: 'Growth Rate', size: 'sm', position: { x: 2, y: 0 }, visible: true },
  { id: 'orders', type: 'kpi', title: 'Orders', size: 'sm', position: { x: 3, y: 0 }, visible: true },
  { id: 'revenue-chart', type: 'chart', title: 'Revenue Overview', size: 'lg', position: { x: 0, y: 1 }, visible: true },
  { id: 'customers', type: 'chart', title: 'Customer Acquisition', size: 'md', position: { x: 2, y: 1 }, visible: true },
  { id: 'ai-summary', type: 'ai', title: 'AI Insights', size: 'md', position: { x: 0, y: 2 }, visible: true },
  { id: 'activity', type: 'list', title: 'Recent Activity', size: 'md', position: { x: 2, y: 2 }, visible: true },
];

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      widgets: defaultWidgets,
      layout: {},
      isEditing: false,

      addWidget: (widget) =>
        set((state) => ({ widgets: [...state.widgets, widget] })),

      removeWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
        })),

      reorderWidgets: (widgets) => set({ widgets }),

      updateWidget: (id, updates) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        })),

      toggleEditing: () =>
        set((state) => ({ isEditing: !state.isEditing })),

      setLayout: (id, layout) =>
        set((state) => ({
          layout: { ...state.layout, [id]: layout },
        })),

      resetLayout: () => set({ widgets: defaultWidgets, layout: {} }),
    }),
    { name: 'dashboard-storage' }
  )
);
