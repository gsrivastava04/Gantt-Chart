import React, { useState } from 'react';
import './App.css';
import GanttChart from './components/GanttChart';

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
  }
];

function App() {
  const [isGanttOpen, setIsGanttOpen] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Project Management Dashboard</h1>
        <button 
          className="show-gantt-button"
          onClick={() => setIsGanttOpen(true)}
        >
          Show Gantt Chart
        </button>
      </header>
      
      <GanttChart 
        isOpen={isGanttOpen}
        onClose={() => setIsGanttOpen(false)}
      />
    </div>
  );
}

export default App;
