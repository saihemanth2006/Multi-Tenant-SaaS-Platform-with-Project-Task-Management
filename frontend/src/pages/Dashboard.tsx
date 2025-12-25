import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  createdAt: string;
  taskCount?: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  projectName?: string;
  projectId: string;
  assignedTo?: string;
}

interface Statistics {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<Statistics>({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch projects
      const projectsResponse = await client.get('/api/projects', {
        params: { limit: 5, offset: 0 },
      });
      const projects = projectsResponse.data.data?.projects || [];

      // Fetch all tasks from all projects to calculate statistics
      // Note: This requires multiple API calls (one per project)
      let allTasks: Task[] = [];
      for (const project of projects) {
        try {
          const tasksResponse = await client.get(`/api/projects/${project.id}/tasks`, {
            params: { limit: 100, offset: 0 },
          });
          allTasks = allTasks.concat(tasksResponse.data.data?.tasks || []);
        } catch (err) {
          // Skip projects where tasks fetch fails
        }
      }

      // Filter user's tasks
      const userTasks = allTasks.filter((task: Task) => task.assignedTo === user?.id);

      // Calculate statistics
      const completedCount = allTasks.filter((t: Task) => t.status === 'completed').length;
      const pendingCount = allTasks.filter(
        (t: Task) => t.status === 'todo' || t.status === 'in_progress'
      ).length;

      setStatistics({
        totalProjects: projects.length,
        totalTasks: allTasks.length,
        completedTasks: completedCount,
        pendingTasks: pendingCount,
      });

      // Set recent projects
      setRecentProjects(projects);

      // Set user's tasks
      setMyTasks(userTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = statusFilter === 'all' ? myTasks : myTasks.filter((t) => t.status === statusFilter);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.fullName}</h1>
          <p className="text-gray-600 mt-1">Here's an overview of your workspace</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.totalProjects}</p>
              </div>
              <div className="text-4xl text-blue-500">📁</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.totalTasks}</p>
              </div>
              <div className="text-4xl text-purple-500">✓</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed Tasks</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{statistics.completedTasks}</p>
              </div>
              <div className="text-4xl text-green-500">✔️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Tasks</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{statistics.pendingTasks}</p>
              </div>
              <div className="text-4xl text-yellow-500">⏳</div>
            </div>
          </div>
        </div>

        {/* Recent Projects Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Recent Projects</h2>
            <Link to="/projects" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-600">No projects yet</p>
              <Link to="/projects/new" className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block">
                Create First Project →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="px-6 py-4 hover:bg-gray-50 transition flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{project.taskCount || 0} tasks</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">My Tasks</h2>
            <Link to="/projects" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </Link>
          </div>

          {/* Task Filter */}
          <div className="px-6 py-4 border-b border-gray-200 flex space-x-2">
            {(['all', 'todo', 'in_progress', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-600">No tasks assigned</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{task.projectName}</p>
                      <div className="flex space-x-2 mt-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>
                    </div>
                    {task.dueDate && (
                      <p className="text-sm text-gray-500 whitespace-nowrap ml-4">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
