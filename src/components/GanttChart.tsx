import React, { useState, useRef, useEffect } from 'react';
import './GanttChart.css';

interface Task {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies: string[];
  children?: Task[];
  isExpanded?: boolean;
}

interface GanttChartProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialTasks: Task[] = [
  {
    id: "Research",
    name: "Find sources",
    start: new Date(2015, 0, 1),
    end: new Date(2015, 0, 5),
    progress: 100,
    dependencies: [],
    children: [
      {
        id: "Write",
        name: "Write paper",
        start: new Date(2015, 0, 1),
        end: new Date(2015, 0, 9),
        progress: 25,
        dependencies: ["Research", "Outline"],
        children: [
          {
            id: "Complete",
            name: "Hand in paper",
            start: new Date(2015, 0, 9),
            end: new Date(2015, 0, 10),
            progress: 0,
            dependencies: ["Cite", "Write"],
          }
        ]
      },
      {
        id: "Cite",
        name: "Create bibliography",
        start: new Date(2015, 0, 5),
        end: new Date(2015, 0, 7),
        progress: 20,
        dependencies: ["Research"],
        children: [
          {
            id: "Complete",
            name: "Hand in paper",
            start: new Date(2015, 0, 9),
            end: new Date(2015, 0, 10),
            progress: 0,
            dependencies: ["Cite", "Write"],
          }
        ]
      },
      {
        id: "Outline",
        name: "Outline paper",
        start: new Date(2015, 0, 5),
        end: new Date(2015, 0, 6),
        progress: 100,
        dependencies: ["Research"],
        children: [
          {
            id: "Write",
            name: "Write paper",
            start: new Date(2015, 0, 1),
            end: new Date(2015, 0, 9),
            progress: 25,
            dependencies: ["Research", "Outline"],
          }
        ]
      }
    ]
  },
  {
    id: "ProjectWithUndefinedTasks",
    name: "Project with undefined tasks",
    start: new Date(2015, 0, 1),
    end: new Date(2015, 0, 20),
    progress: 40,
    dependencies: [],
    children: [
      {
        id: "ChildNoStart",
        name: "Child with no start date",
        start: null as any,
        end: new Date(2015, 0, 15),
        progress: 60,
        dependencies: [],
        children: []
      },
      {
        id: "ChildNoEnd",
        name: "Child with no end date",
        start: new Date(2015, 0, 10),
        end: null as any,
        progress: 30,
        dependencies: [],
        children: []
      },
      {
        id: "ChildNoDates",
        name: "Child with no dates",
        start: null as any,
        end: null as any,
        progress: 0,
        dependencies: [],
        children: []
      },
      {
        id: "ChildWithDates",
        name: "Child with all dates",
        start: new Date(2015, 0, 5),
        end: new Date(2015, 0, 12),
        progress: 100,
        dependencies: [],
        children: []
      }
    ]
  },
  {
    id: "NoStartDate",
    name: "Task with no start date",
    start: null as any,
    end: new Date(2015, 0, 15),
    progress: 50,
    dependencies: [],
    children: []
  },
  {
    id: "NoEndDate",
    name: "Task with no end date",
    start: new Date(2015, 0, 20),
    end: null as any,
    progress: 30,
    dependencies: [],
    children: []
  },
  {
    id: "NoDates",
    name: "Task with no dates",
    start: null as any,
    end: null as any,
    progress: 0,
    dependencies: [],
    children: []
  }
];

const GanttChart: React.FC<GanttChartProps> = ({ isOpen, onClose }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [tooltip, setTooltip] = useState<{ task: Task; x: number; y: number } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 500, height: 500 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const toggleTask = (taskId: string) => {
    const updateTaskExpanded = (tasks: Task[]): Task[] => {
      return tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            isExpanded: !task.isExpanded
          };
        }
        if (task.children) {
          return {
            ...task,
            children: updateTaskExpanded(task.children)
          };
        }
        return task;
      });
    };

    setTasks(updateTaskExpanded(tasks));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleBarHover = (task: Task, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      task,
      x: rect.left,
      y: rect.top - 30
    });
  };

  const handleBarLeave = () => {
    setTooltip(null);
  };

  const generateTimeline = () => {
    const startDate = new Date(2015, 0, 1);
    const endDate = new Date(2015, 0, 31);
    const days = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const renderTimeline = () => {
    const days = generateTimeline();
    return (
      <div className="timeline">
        {days.map((date, index) => (
          <div key={index} className="timeline-day">
            <div className="timeline-date">{formatDate(date)}</div>
            <div className="timeline-line"></div>
          </div>
        ))}
      </div>
    );
  };

  const renderTask = (task: Task, level: number = 0) => {
    const hasChildren = task.children && task.children.length > 0;
    const isExpanded = task.isExpanded !== false;
    const hasStartDate = task.start instanceof Date;
    const hasEndDate = task.end instanceof Date;
    const hasDates = hasStartDate && hasEndDate;

    const getBarStyle = () => {
      if (!hasDates) {
        return {
          width: '100%',
          marginLeft: '0',
          backgroundColor: '#ccc',
          opacity: 0.5
        };
      }

      const width = hasStartDate && hasEndDate 
        ? `${(task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)}%`
        : '100%';
      
      const marginLeft = hasStartDate
        ? `${(task.start.getTime() - new Date(2015, 0, 1).getTime()) / (1000 * 60 * 60 * 24)}%`
        : '0';

      return {
        width,
        marginLeft,
        backgroundColor: task.progress === 100 ? '#4CAF50' : 
                       task.progress > 0 ? '#2196F3' : '#FFC107'
      };
    };

    return (
      <React.Fragment key={task.id}>
        <div 
          className="task-row"
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => hasChildren && toggleTask(task.id)}
        >
          <div className="task-name">
            {hasChildren && (
              <span className="expand-icon">
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            {task.name}
            {!hasDates && <span className="date-warning"> (No dates set)</span>}
            {!hasStartDate && hasEndDate && <span className="date-warning"> (No start date)</span>}
            {hasStartDate && !hasEndDate && <span className="date-warning"> (No end date)</span>}
          </div>
          <div 
            className="task-bar-container"
            onMouseEnter={(e) => handleBarHover(task, e)}
            onMouseLeave={handleBarLeave}
          >
            <div 
              className="task-bar"
              style={getBarStyle()}
            >
              <div 
                className="task-progress"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && task.children?.map(child => renderTask(child, level + 1))}
      </React.Fragment>
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.max(400, size.width + (e.clientX - dragStart.x));
      const newHeight = Math.max(400, size.height + (e.clientY - dragStart.y));
      setSize({
        width: newWidth,
        height: newHeight
      });
      setDragStart({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', isDragging ? handleMouseMove : handleResizeMouseMove);
      document.addEventListener('mouseup', isDragging ? handleMouseUp : handleResizeMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isDragging, isResizing]);

  if (!isOpen) return null;

  return (
    <div className="gantt-modal">
      <div 
        className="gantt-modal-content"
        ref={modalRef}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `translate(${position.x}px, ${position.y}px)`
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="gantt-modal-header">
          <h2>Gantt Chart</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="gantt-chart">
          <div className="timeline-container">
            <div className="timeline-spacer"></div>
            {renderTimeline()}
          </div>
          <div className="tasks-container">
            {tasks.map(task => renderTask(task))}
          </div>
        </div>
        <div 
          className="resize-handle"
          onMouseDown={handleResizeMouseDown}
        />
        {tooltip && (
          <div 
            className="tooltip"
            style={{
              left: tooltip.x,
              top: tooltip.y
            }}
          >
            <div className="tooltip-content">
              {tooltip.task.name} | Progress: {tooltip.task.progress}% | {formatDate(tooltip.task.start)} - {formatDate(tooltip.task.end)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttChart; 