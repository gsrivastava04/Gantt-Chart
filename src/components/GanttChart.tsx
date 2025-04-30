import React, { useState, useRef, useEffect } from 'react';
import './GanttChart.css';

interface Task {
  id: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
  progress: number;
  dependencies: string[];
  children: Task[];
  isExpanded?: boolean;
  status?: string;
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
  id: "1234",
  name: "ETL_MAIN_SOME_BIG_NAME_XXXXXXX_EXRA",
  startTime: "2025/04/29 10:52:29.000 +0000",
  endTime: "2025/04/29 12:49:46.000 +0000",
  progress: 100,
  status: "Success",
  dependencies: ["jkl","def"],
  children: [
    {
      id: "abc",
      name: "ETL_DATA",
      startTime: "2025/04/29 12:49:30.000 +0000",
      endTime: "2025/04/29 12:49:46.000 +0000",
      progress: 100,
      status: "Success",
      dependencies: [],
      children: []
    },
    {
      id: "xyz",
      name: "ETL_DATA_TRANSFORM",
      startTime: "2025/04/29 12:48:37.000 +0000",
      endTime: "2025/04/29 12:49:00.000 +0000",
      progress: 100,
      status: "Success",
      dependencies: [],
      children: []
    },
    {
      id: "def",
      name: "ETL_LOAD",
      startTime: "2025/04/29 11:30:00.000 +0000",
      endTime: "2025/04/29 12:10:00.000 +0000",
      progress: 80,
      status: "In-Progress",
      dependencies: [],
      children: []
    },
    {
      id: "ghi",
      name: "ETL_VALIDATE",
      startTime: "2025/04/29 11:00:00.000 +0000",
      endTime: "2025/04/29 12:00:00.000 +0000",
      progress: 50,
      status: "In-Progress",
      dependencies: [],
      children: []
    },
    {
      id: "jkl",
      name: "ETL_EXPORT",
      startTime: "2025/04/29 12:20:00.000 +0000",
      endTime: "2025/04/30 07:49:30.000 +0000",
      progress: 0,
      status: "Not-Started",
      dependencies: [],
      children: []
    }
  ]
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
    let dateObj: Date | null;
    if (typeof date === 'string') {
      dateObj = parseCustomDate(date);
    } else {
      dateObj = date;
    }
    if (!dateObj || isNaN(dateObj.getTime())) return 'Invalid date';
    // Format: Apr 29, 04:22:29 PM (no ms)
    return dateObj.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
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
    if (task.status === 'Failed') return 'failed';
    if (task.status === 'Success') return 'success';
    if (task.status === 'In-Progress') return 'in-progress';
    if (task.status === 'Not-Started') return 'not-started';
    if (!task.startTime) return 'not-started';
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

  // Helper to robustly parse the new date format
  const parseCustomDate = (dateStr: string | null): Date | null => {
    if (!dateStr) return null;
    const match = dateStr.match(/(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [ , year, month, day, hour, min, sec ] = match;
      return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
    }
    // fallback
    return new Date(dateStr);
  };

  // Recursively scan all tasks to find min start and max end
  const findDateRange = (task: Task): { min: Date | null, max: Date | null } => {
    let min: Date | null = task.startTime ? parseCustomDate(task.startTime) : null;
    let max: Date | null = task.endTime ? parseCustomDate(task.endTime) : null;
    for (const child of task.children || []) {
      const childRange = findDateRange(child);
      if (childRange.min && (!min || childRange.min > childRange.min)) min = childRange.min;
      if (childRange.max && (!max || childRange.max < childRange.max)) max = childRange.max;
    }
    return { min, max };
  };

  // Scan all leaf tasks for true min start and max end
  const getAllTaskDates = (task: Task, acc: Date[] = []): Date[] => {
    if (task.startTime) acc.push(parseCustomDate(task.startTime)!);
    if (task.endTime) acc.push(parseCustomDate(task.endTime)!);
    for (const child of task.children || []) {
      getAllTaskDates(child, acc);
    }
    return acc;
  };
  const allDates = getAllTaskDates(tasks).filter(Boolean).sort((a, b) => a.getTime() - b.getTime());
  let chartStartDate = allDates.length > 0 ? allDates[0] : null;
  let chartEndDate = allDates.length > 0 ? allDates[allDates.length - 1] : null;
  // If all dates are null, provide a default window
  if (!chartStartDate || !chartEndDate) {
    chartStartDate = new Date();
    chartEndDate = new Date(chartStartDate.getTime() + 3 * 60 * 60 * 1000); // +3 hours
  }

  // --- Dynamically divide timeline into N equal segments, with extra tick at start and end ---
  let numTimelineTicks = 6; // minimum 6 ticks for good spacing
  let timelineIntervalMs = 30 * 60 * 1000; // default, will recalculate
  if (chartStartDate && chartEndDate) {
    const totalMs = chartEndDate.getTime() - chartStartDate.getTime();
    if (totalMs > 0) {
      timelineIntervalMs = totalMs / (numTimelineTicks - 1);
    }
    // Add one extra interval before and after
    chartStartDate = new Date(chartStartDate.getTime() - timelineIntervalMs);
    chartEndDate = new Date(chartEndDate.getTime() + timelineIntervalMs);
    numTimelineTicks += 2;
  }


  const getBarStyle = (task: Task) => {
    const hasStartDate = task.startTime !== null;
    const hasEndDate = task.endTime !== null;
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

    const startTime = task.startTime ? parseCustomDate(task.startTime) : null;
    const endTime = task.endTime ? parseCustomDate(task.endTime) : null;
    if (!chartStartDate || !chartEndDate || !startTime || !endTime) {
      return {
        width: '100%',
        marginLeft: '0',
        backgroundColor: '#E6F3FF',
        opacity: 0.7
      };
    }
    const totalDuration = chartEndDate.getTime() - chartStartDate.getTime();
    // Clamp task start/end to the chart range
    const clampedStart = Math.max(startTime.getTime(), chartStartDate.getTime());
    const clampedEnd = Math.min(endTime.getTime(), chartEndDate.getTime());
    const taskDuration = Math.max(0, clampedEnd - clampedStart);
    const taskStartOffset = clampedStart - chartStartDate.getTime();

    const width = `${(taskDuration / totalDuration) * 100}%`;
    const marginLeft = `${(taskStartOffset / totalDuration) * 100}%`;

    const baseColor = getJobColor(task);
    const progressColor = task.progress === 100 ? '#38A169' : 
                         task.progress > 0 ? '#4299E1' : '#E6F3FF';

    // Calculate progress fill only up to the end of the task, not beyond
    const progressWidth = taskDuration > 0 ? `${(task.progress / 100) * 100}%` : '0%';
// progressWidth is now used in the progress overlay div below.

    return {
      width,
      marginLeft,
      backgroundColor: baseColor,
      backgroundImage: isMixedStatus 
        ? `repeating-linear-gradient(45deg, ${baseColor}, ${baseColor} 10px, ${progressColor} 10px, ${progressColor} 20px)`
        : 'none',
      border: task.children && task.children.length > 0 ? '2px solid #4A5568' : '1px solid #CBD5E0',
      boxShadow: isMixedStatus ? '0 0 0 2px #F59E0B' : 'none',
      position: "relative" as const // for progress overlay
    };
  };

  // --- In renderTask, update bar rendering to use a progress overlay ---


  const renderDependencyLines = () => {
    if (!taskPositions.length) return null;

    const lines: JSX.Element[] = [];
    // Match to timeline-spacer and marginLeft in timeline (120 + 120)
    const taskNameWidth = 240; 

    const renderDependencies = (task: Task) => {
      task.dependencies.forEach((depId: string) => {
        const sourceTask = taskPositions.find((t: TaskPosition) => t.id === depId);
        const targetTask = taskPositions.find((t: TaskPosition) => t.id === task.id);

        if (!sourceTask || !targetTask) return;

        const containerRect = chartRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        // Start at the left edge of the source (dependent) bar
        const startX = targetTask.x - containerRect.left + taskNameWidth;
        const startY = targetTask.y - containerRect.top + targetTask.height / 2;

        // End exactly at the left edge of the colored bar (including marginLeft from getBarStyle)
        let dependencyMarginLeft = 0;
        try {
          // Try to get the marginLeft from the bar style (should match getBarStyle logic)
          const depTask = tasks;
          const findTaskById = (task: Task, id: string): Task | null => {
            if (task.id === id) return task;
            if (task.children) {
              for (const child of task.children) {
                const found = findTaskById(child, id);
                if (found) return found;
              }
            }
            return null;
          };
          const depTaskObj = findTaskById(tasks, sourceTask.id);
          if (depTaskObj) {
            const barStyle = getBarStyle(depTaskObj);
            if (barStyle && typeof barStyle.marginLeft === 'string') {
              dependencyMarginLeft = parseFloat(barStyle.marginLeft);
            }
          }
        } catch (e) {}
        const endX = sourceTask.x - containerRect.left + taskNameWidth + dependencyMarginLeft;
        const endY = sourceTask.y - containerRect.top + sourceTask.height / 2;

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
    const jobState = getJobState(task);

    return (
      <React.Fragment key={task.id}>
        <div 
          className="task-row"
          data-task-id={task.id}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => hasChildren && toggleTask(task.id)}
        >
          <div 
            className="task-name" 
            title={task.name}
            style={{
              display: 'flex',
              minWidth: '120px',
              maxWidth: '260px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {hasChildren && (
              <span className="expand-icon">
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            <span className="task-name-text">{task.name}</span>
            {jobState === 'failed' && (
              <span style={{ 
                color: '#F59E0B',
                marginLeft: '8px',
                fontWeight: 500
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
              style={getBarStyle(task)}
              onMouseEnter={e => handleBarHover(task, e)}
              onMouseLeave={handleBarLeave}
            >
              {/* Progress fill overlay, never exceeds clamped bar */}
              {(() => {
                // Compute clamped progress width for this task only
                const startTime = task.startTime ? parseCustomDate(task.startTime) : null;
                const endTime = task.endTime ? parseCustomDate(task.endTime) : null;
                if (!chartStartDate || !chartEndDate || !startTime || !endTime) return null;
                const clampedStart = Math.max(startTime.getTime(), chartStartDate.getTime());
                const clampedEnd = Math.min(endTime.getTime(), chartEndDate.getTime());
                const taskDuration = Math.max(0, clampedEnd - clampedStart);
                const progressWidth = taskDuration > 0 ? `${(task.progress / 100) * 100}%` : '0%';
                return (
                  <div 
                    className="task-progress"
                    style={{ 
                      width: progressWidth,
                      backgroundColor: jobState === 'failed' ? '#FF0000' : 
                                     jobState === 'success' ? '#38A169' : 
                                     jobState === 'in-progress' ? '#0078D7' : '#E6F3FF',
                      height: '100%',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      zIndex: 1,
                      borderRadius: '4px'
                    }}
                  />
                );
              })()}
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

  // Generate timeline hours between chartStartDate and chartEndDate
  // Generate timeline ticks with at least 6 ticks, using smaller intervals if needed
  const generateTimeline = (): Date[] => {
    if (!chartStartDate || !chartEndDate) return [];
    const ticks: Date[] = [];
    for (let i = 0; i < numTimelineTicks; i++) {
      ticks.push(new Date(chartStartDate.getTime() + i * timelineIntervalMs));
    }
    return ticks;
  };



  const renderTimeline = () => {
    const hours = generateTimeline();
    return (
      <div className="timeline" style={{ display: 'flex', marginLeft: 120 }}>
        {/* Spacer to align timeline with bar start (after smallest task name) */}
        <div className="timeline-spacer" style={{ width: 120, minWidth: 120, maxWidth: 120 }} />
        {hours.map((date: Date, index: number) => (
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
                  <span>{tooltip.task.startTime ? formatDate(tooltip.task.startTime) : 'Not set'}</span>
                </div>
                <div className="date-row">
                  <span className="date-label">End:</span>
                  <span>{tooltip.task.endTime ? formatDate(tooltip.task.endTime) : 'Not set'}</span>
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