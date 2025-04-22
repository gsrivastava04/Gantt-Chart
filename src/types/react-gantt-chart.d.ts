declare module 'react-gantt-chart' {
  import { ReactNode } from 'react';

  export interface GanttTask {
    id: string;
    name: string;
    start: Date;
    end: Date;
    progress: number;
    dependencies?: string[];
    custom_class?: string;
  }

  export interface GanttProps {
    tasks: GanttTask[];
    viewMode?: 'Day' | 'Week' | 'Month';
    onTaskClick?: (task: GanttTask) => void;
    onDateChange?: (task: GanttTask, start: Date, end: Date) => void;
    customTaskBarContent?: (task: GanttTask) => ReactNode;
    customTaskBarBackground?: (task: GanttTask) => string;
  }

  export const Gantt: React.FC<GanttProps>;
} 