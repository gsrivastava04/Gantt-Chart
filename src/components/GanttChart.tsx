import React, { useState, useRef, useEffect } from 'react';
import './GanttChart.css';

interface Task {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  dependencies: string[];
  children: Task[];
  isExpanded?: boolean;
  status?: 'failed' | 'success' | 'in-progress' | 'not-started';
}

interface TaskPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GanttChartProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialTasks: Task = {
  "id": "job1",
  "name": "ETL_DAILY_LOAD_MASTER",
  "startDate": "2025-06-12T08:00:00-05:00",
  "endDate": "2025-06-12T20:00:00-05:00",
  "progress": 75,
  "dependencies": [],
  "children": [
    {
      "id": "child job1",
      "name": "ETL_EXTRACT_CUSTOMER_DATA",
      "startDate": "2025-06-12T08:15:00-05:00",
      "endDate": "2025-06-12T09:45:00-05:00",
      "progress": 100,
      "status": "success",
      "dependencies": [],
      "children": [
        {
          "id": "child job11",
          "name": "ETL_VALIDATE_CUSTOMER_FILES",
          "startDate": "2025-06-12T08:20:00-05:00",
          "endDate": "2025-06-12T08:45:00-05:00",
          "progress": 100,
          "status": "success",
          "dependencies": [],
          "children": []
        },
        {
          "id": "child job12",
          "name": "ETL_TRANSFORM_CUSTOMER_DATA",
          "startDate": "2025-06-12T08:50:00-05:00",
          "endDate": "2025-06-12T09:30:00-05:00",
          "progress": 100,
          "status": "success",
          "dependencies": ["Job1"],
          "children": []
        }
      ]
    },
    {
      "id": "child job2",
      "name": "ETL_EXTRACT_PRODUCT_DATA",
      "startDate": "2025-06-12T09:00:00-05:00",
      "endDate": "2025-06-12T11:30:00-05:00",
      "progress": 60,
      "status": "failed",
      "dependencies": ["job1"],
      "children": [
        {
          "id": "child job21",
          "name": "ETL_VALIDATE_PRODUCT_FILES",
          "startDate": "2025-06-12T09:10:00-05:00",
          "endDate": "2025-06-12T09:40:00-05:00",
          "progress": 100,
          "status": "success",
          "dependencies": [],
          "children": []
        },
        {
          "id": "child job22",
          "name": "ETL_TRANSFORM_PRODUCT_DATA",
          "startDate": "2025-06-12T09:45:00-05:00",
          "endDate": "2025-06-12T11:15:00-05:00",
          "progress": 60,
          "status": "failed",
          "dependencies": [],
          "children": []
        }
      ]
    },
    {
      "id": "child job3",
      "name": "ETL_EXTRACT_TRANSACTION_DATA",
      "startDate": "2025-06-12T10:30:00-05:00",
      "endDate": "2025-06-12T14:45:00-05:00",
      "progress": 75,
      "status": "in-progress",
      "dependencies": ["job1"],
      "children": [
        {
          "id": "child job31",
          "name": "ETL_VALIDATE_TRANSACTION_FILES",
          "startDate": "2025-06-12T10:40:00-05:00",
          "endDate": "2025-06-12T11:30:00-05:00",
          "progress": 100,
          "status": "success",
          "dependencies": [],
          "children": []
        },
        {
          "id": "child job32",
          "name": "ETL_TRANSFORM_TRANSACTION_DATA",
          "startDate": "2025-06-12T11:35:00-05:00",
          "endDate": "2025-06-12T13:30:00-05:00",
          "progress": 90,
          "status": "in-progress",
          "dependencies": [],
          "children": []
        },
        {
          "id": "child job33",
          "name": "ETL_LOAD_TRANSACTION_DATA",
          "startDate": "2025-06-12T13:35:00-05:00",
          "endDate": null,
          "progress": 40,
          "status": "in-progress",
          "dependencies": [],
          "children": []
        }
      ]
    },
    {
      "id": "child job4",
      "name": "ETL_DATA_WAREHOUSE_LOAD",
      "startDate": null,
      "endDate": null,
      "progress": 0,
      "status": "not-started",
      "dependencies": [],
      "children": []
    },
    {
      "id": "job2",
      "name": "REPORT_GENERATION_MASTER",
      "startDate": "2025-06-12T15:00:00-05:00",
      "endDate": null,
      "progress": 10,
      "status": "in-progress",
      "dependencies": [],
      "children": [
        {
          "id": "child job5",
          "name": "REPORT_DAILY_SALES",
          "startDate": "2025-06-12T15:30:00-05:00",
          "endDate": null,
          "progress": 0,
          "status": "in-progress",
          "dependencies": [],
          "children": []
        },
        {
          "id": "child job6",
          "name": "REPORT_INVENTORY_STATUS",
          "startDate": null,
          "endDate": null,
          "progress": 0,
          "status": "not-started",
          "dependencies": [],
          "children": []
        }
      ]
    },
    {
      "id": "job3",
      "name": "SYSTEM_BACKUP",
      "startDate": "2025-06-12T19:00:00-05:00",
      "endDate": null,
      "progress": 0,
      "status": "not-started",
      "dependencies": [],
      "children": []
    }]
};

const GanttChart: React.FC<GanttChartProps> = ({ isOpen, onClose }) => {
  const [tasks, setTasks] = useState<Task>(initialTasks); 
  const [tooltip, setTooltip] = useState<{ task: Task; x: number; y: number } | null>(null);
  const [size, setSize] = useState({ width: Math.min(1200, window.innerWidth * 0.8), height: Math.min(800, window.innerHeight * 0.8) });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'right' | 'bottom' | 'corner' | null>(null);
  const [taskPositions, setTaskPositions] = useState<TaskPosition[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const tasksContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tasksContainerRef.current) return;

    const updateTaskPositions = () => {
      const positions: TaskPosition[] = [];
      const taskElements = tasksContainerRef.current?.querySelectorAll('.task-row');
      
      taskElements?.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const taskId = element.getAttribute('data-task-id');
        if (taskId) {
          positions.push({
            id: taskId,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height
          });
        }
      });

      setTaskPositions(positions);
    };

    updateTaskPositions();
    window.addEventListener('resize', updateTaskPositions);
    return () => window.removeEventListener('resize', updateTaskPositions);
  }, [tasks, size]);

  const toggleTask = (taskId: string) => {
    const updateTaskExpanded = (task: Task): Task => {
      if (task.id === taskId) {
        return {
          ...task,
          isExpanded: !task.isExpanded
        };
      }
      if (task.children && task.children.length > 0) {
        return {
          ...task,
          children: task.children.map(child => updateTaskExpanded(child))
        };
      }
      return task;
    };
    setTasks(updateTaskExpanded(tasks));
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Not set';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBarHover = (task: Task, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 300; 
    const tooltipHeight = 100; 
    
    let left = rect.left;
    let top = rect.top - tooltipHeight - 10; 
    
    if (left + tooltipWidth > window.innerWidth) {
      left = window.innerWidth - tooltipWidth - 10;
    }
    
    if (top < 0) {
      top = rect.bottom + 10; 
    }

    setTooltip({
      task,
      x: left,
      y: top
    });
  };

  const handleBarLeave = () => {
    setTooltip(null);
  };

  const getJobState = (task: Task) => {
    if (task.status === 'failed') return 'failed';
    if (!task.startDate) return 'not-started';
    if (task.progress === 100) return 'success';
    if (task.progress > 0) return 'in-progress';
    return 'not-started';
  };

  const getJobColor = (task: Task) => {
    const state = getJobState(task);
    switch (state) {
      case 'not-started':
        return '#E6F3FF'; 
      case 'in-progress':
        return '#0078D7'; 
      case 'success':
        return '#38A169'; 
      case 'failed':
        return '#FF0000'; 
      default:
        return '#E6F3FF';
    }
  };

  const hasMixedChildStatus = (task: Task): boolean => {
    if (!task.children || task.children.length === 0) return false;
    
    const childStates = task.children.map(child => getJobState(child));
    const uniqueStates = new Set(childStates);
    return uniqueStates.size > 1;
  };

  const getBarStyle = (task: Task) => {
    const hasStartDate = task.startDate !== null;
    const hasEndDate = task.endDate !== null;
    const hasDates = hasStartDate && hasEndDate;
    const isMixedStatus = hasMixedChildStatus(task);

    if (!hasDates) {
      return {
        width: '100%',
        marginLeft: '0',
        backgroundColor: '#E6F3FF', 
        opacity: 0.7,
        backgroundImage: isMixedStatus ? 'repeating-linear-gradient(45deg, #E6F3FF, #E6F3FF 10px, #4299E1 10px, #4299E1 20px)' : 'none'
      };
    }

    const startDate = new Date(task.startDate!);
    const endDate = task.endDate ? new Date(task.endDate) : new Date();
    const chartStartDate = new Date('2025-06-12T00:00:00-05:00');
    const chartEndDate = new Date('2025-06-13T00:00:00-05:00');
    const totalDuration = chartEndDate.getTime() - chartStartDate.getTime();
    const taskDuration = endDate.getTime() - startDate.getTime();
    const taskStartOffset = startDate.getTime() - chartStartDate.getTime();

    const width = `${(taskDuration / totalDuration) * 100}%`;
    const marginLeft = `${(taskStartOffset / totalDuration) * 100}%`;

    const baseColor = getJobColor(task);
    const progressColor = task.progress === 100 ? '#38A169' : 
                         task.progress > 0 ? '#4299E1' : '#E6F3FF';

    return {
      width,
      marginLeft,
      backgroundColor: baseColor,
      backgroundImage: isMixedStatus 
        ? `repeating-linear-gradient(45deg, ${baseColor}, ${baseColor} 10px, ${progressColor} 10px, ${progressColor} 20px)`
        : `linear-gradient(to right, ${progressColor} ${task.progress}%, ${baseColor} ${task.progress}%)`,
      border: task.children && task.children.length > 0 ? '2px solid #4A5568' : '1px solid #CBD5E0',
      boxShadow: isMixedStatus ? '0 0 0 2px #F59E0B' : 'none'
    };
  };

  const renderDependencyLines = () => {
    if (!taskPositions.length) return null;

    const lines: JSX.Element[] = [];
    const taskNameWidth = 200; 

    const renderDependencies = (task: Task) => {
      task.dependencies.forEach((depId: string) => {
        const sourceTask = taskPositions.find((t: TaskPosition) => t.id === depId);
        const targetTask = taskPositions.find((t: TaskPosition) => t.id === task.id);

        if (!sourceTask || !targetTask) return;

        const containerRect = chartRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const startX = sourceTask.x - containerRect.left + taskNameWidth; 
        const startY = sourceTask.y - containerRect.top + sourceTask.height / 2;
        
        const targetStartDate = task.startDate ? new Date(task.startDate) : null;
        const chartStartDate = new Date('2025-06-12T00:00:00-05:00');
        const chartEndDate = new Date('2025-06-13T00:00:00-05:00');
        const totalDuration = chartEndDate.getTime() - chartStartDate.getTime();
        
        let targetBarStartX;
        if (targetStartDate) {
          const taskStartOffset = targetStartDate.getTime() - chartStartDate.getTime();
          const offsetPercentage = (taskStartOffset / totalDuration) * 100;
          targetBarStartX = taskNameWidth + (offsetPercentage * (targetTask.width - taskNameWidth) / 100);
        } else {
          targetBarStartX = taskNameWidth;
        }

        const endX = targetTask.x - containerRect.left + targetBarStartX;
        const endY = targetTask.y - containerRect.top + targetTask.height / 2;

        const verticalLineX = startX + 20; 

        const sourcePath = `M ${startX} ${startY} L ${verticalLineX} ${startY}`; 
        const verticalPath = `M ${verticalLineX} ${Math.min(startY, endY)} L ${verticalLineX} ${Math.max(startY, endY)}`; 
        const targetPath = `M ${verticalLineX} ${endY} L ${endX} ${endY}`; 

        lines.push(
          <g key={`${depId}-${task.id}`}>
            <path
              d={sourcePath}
              className="dependency-line"
              stroke="#FF4500"
              strokeWidth="1.2"
              strokeDasharray="4,2"
              fill="none"
            />
            <path
              d={verticalPath}
              className="dependency-line"
              stroke="#FF4500"
              strokeWidth="1.2"
              strokeDasharray="4,2"
              fill="none"
            />
            <path
              d={targetPath}
              className="dependency-line"
              stroke="#FF4500"
              strokeWidth="1.2"
              strokeDasharray="4,2"
              fill="none"
            />
            <path
              d={`M ${endX} ${endY} l -8 -4 l 0 8 z`}
              fill="#FF4500"
              stroke="none"
            />
          </g>
        );
      });

      task.children.forEach(child => renderDependencies(child));
    };

    const traverseTasks = (task: Task, fn: (t: Task) => void) => {
      fn(task);
      if (task.children && task.children.length > 0) {
        task.children.forEach(child => traverseTasks(child, fn));
      }
    };
    traverseTasks(tasks, renderDependencies);

    return lines;
  };

  const renderTask = (task: Task, level: number = 0) => {
    const hasChildren = task.children && task.children.length > 0;
    const isExpanded = task.isExpanded !== false;
    const hasStartDate = task.startDate !== null;
    const hasEndDate = task.endDate !== null;
    const hasDates = hasStartDate && hasEndDate;
    const jobState = getJobState(task);

    return (
      <React.Fragment key={task.id}>
        <div 
          className="task-row"
          data-task-id={task.id}
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
            {jobState === 'failed' && (
              <span style={{ 
                color: '#F59E0B',
                marginLeft: '8px',
                fontWeight: '500'
              }}>
                (Failed)
              </span>
            )}
          </div>
          <div 
            className="task-bar-container"
            onMouseEnter={(e) => handleBarHover(task, e)}
            onMouseLeave={handleBarLeave}
          >
            <div 
              className="task-bar"
              style={{
                ...getBarStyle(task),
                border: jobState === 'failed' ? '2px solid #F59E0B' : undefined
              }}
            >
              <div 
                className="task-progress"
                style={{ 
                  width: `${task.progress}%`,
                  backgroundColor: jobState === 'failed' ? '#FF0000' : 
                                 jobState === 'success' ? '#38A169' : 
                                 jobState === 'in-progress' ? '#0078D7' : '#E6F3FF'
                }}
              />
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && task.children?.map(child => renderTask(child, level + 1))}
      </React.Fragment>
    );
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: 'right' | 'bottom' | 'corner') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizing || !modalRef.current) return;

    const rect = modalRef.current.getBoundingClientRect();
    const minWidth = 800;
    const minHeight = 400;
    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.95;

    let newWidth = size.width;
    let newHeight = size.height;

    if (resizeDirection === 'right' || resizeDirection === 'corner') {
      newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX - rect.left));
    }
    if (resizeDirection === 'bottom' || resizeDirection === 'corner') {
      newHeight = Math.max(minHeight, Math.min(maxHeight, e.clientY - rect.top));
    }

    setSize({
      width: newWidth,
      height: newHeight
    });
  };

  const handleResizeMouseUp = () => {
    setIsResizing(false);
    setResizeDirection(null);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };
  }, [isResizing]);

  const generateTimeline = () => {
    const startDate = new Date('2025-06-12T00:00:00-05:00');
    const endDate = new Date('2025-06-13T00:00:00-05:00');
    const hours = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      hours.push(new Date(currentDate));
      currentDate.setHours(currentDate.getHours() + 1);
    }

    return hours;
  };

  const renderTimeline = () => {
    const hours = generateTimeline();
    return (
      <div className="timeline">
        {hours.map((date, index) => (
          <div key={index} className="timeline-hour">
            <div className="timeline-time">{formatDate(date)}</div>
            <div className="timeline-line"></div>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="gantt-modal">
      <div 
        className="gantt-modal-content"
        ref={modalRef}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`
        }}
      >
        <div className="gantt-modal-header">
          <h2>Gantt Chart</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="gantt-chart" ref={chartRef}>
          <div className="timeline-container">
            <div className="timeline-spacer"></div>
            {renderTimeline()}
          </div>
          <div className="tasks-container" ref={tasksContainerRef}>
            {renderTask(tasks)}
          </div>
          <svg 
            className="dependency-lines" 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              pointerEvents: 'none',
              zIndex: 1,
              overflow: 'visible'
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#ff0000" />
              </marker>
            </defs>
            {renderDependencyLines()}
          </svg>
        </div>
        <div className="resize-handle-right" onMouseDown={(e) => handleResizeMouseDown(e, 'right')} />
        <div className="resize-handle-bottom" onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')} />
        <div className="resize-handle-corner" onMouseDown={(e) => handleResizeMouseDown(e, 'corner')} />
        {tooltip && (
          <div className="tooltip" style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}>
            <div className="tooltip-content">
              <div className="tooltip-header">{tooltip.task.name}</div>
              <div className="tooltip-status">
                <span 
                  className="status-dot"
                  style={{ backgroundColor: getJobColor(tooltip.task) }}
                ></span>
                <span>Status: {getJobState(tooltip.task).charAt(0).toUpperCase() + getJobState(tooltip.task).slice(1)}</span>
              </div>
              <div className="tooltip-progress">
                <span>Progress:</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${tooltip.task.progress}%`,
                      backgroundColor: tooltip.task.progress === 100 ? '#38A169' : '#4299E1'
                    }}
                  ></div>
                </div>
                <span>{tooltip.task.progress}%</span>
              </div>
              <div className="tooltip-dates">
                <div className="date-row">
                  <span className="date-label">Start:</span>
                  <span>{tooltip.task.startDate ? formatDate(tooltip.task.startDate) : 'Not set'}</span>
                </div>
                <div className="date-row">
                  <span className="date-label">End:</span>
                  <span>{tooltip.task.endDate ? formatDate(tooltip.task.endDate) : 'Not set'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttChart; 