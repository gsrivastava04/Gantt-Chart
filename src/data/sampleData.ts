import { GanttData } from '../types';

export const sampleData: GanttData = {
  jobs: [
    {
      id: 'job1',
      name: 'ETL Process',
      startDate: new Date(2024, 0, 1, 8, 0),
      endDate: new Date(2024, 0, 1, 10, 0),
      status: 'success',
      dependencies: [],
      children: ['job2', 'job3'],
      progress: 100
    },
    {
      id: 'job2',
      name: 'Data Validation',
      startDate: new Date(2024, 0, 1, 10, 0),
      endDate: new Date(2024, 0, 1, 11, 0),
      status: 'running',
      dependencies: ['job1'],
      children: ['job4'],
      progress: 50
    },
    {
      id: 'job3',
      name: 'Report Generation',
      startDate: new Date(2024, 0, 1, 10, 0),
      endDate: new Date(2024, 0, 1, 12, 0),
      status: 'pending',
      dependencies: ['job1'],
      children: [],
      progress: 0
    },
    {
      id: 'job4',
      name: 'Data Export',
      startDate: new Date(2024, 0, 1, 11, 0),
      endDate: new Date(2024, 0, 1, 12, 0),
      status: 'pending',
      dependencies: ['job2'],
      children: [],
      progress: 0
    }
  ]
}; 