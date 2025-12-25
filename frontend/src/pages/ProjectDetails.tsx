import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { TaskModal } from '../components/TaskModal';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'completed';
  createdAt: string;
  createdBy: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
}

export const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<'project' | 'task' | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [changeStatusTaskId, setChangeStatusTaskId] = useState<string | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<'todo' | 'in_progress' | 'completed'>('todo');

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchTasks();
    }
  }, [projectId]);

  useEffect(() => {
    filterTasks();
  }, [tasks, statusFilter, priorityFilter]);

  const fetchProject = async () => {
    try {
      const response = await client.get(`/api/projects/${projectId}`);
      setProject(response.data.data);
      setNewName(response.data.data.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project');
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await client.get(`/api/projects/${projectId}/tasks`);
      setTasks(response.data.data?.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((t) => t.priority === priorityFilter);
    }

    setFilteredTasks(filtered);
  };

  const handleUpdateProjectName = async () => {
    if (!newName.trim() || newName === project?.name) {
      setEditingName(false);
      return;
    }

    try {
      const response = await client.put(`/api/projects/${projectId}`, {
        name: newName.trim(),
        description: project?.description,
        status: project?.status,
      });
      setProject(response.data.data);
      setEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    try {
      await client.delete(`/api/projects/${projectId}`);
      navigate('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await client.delete(`/api/tasks/${taskId}`);
      setTasks(tasks.filter((t) => t.id !== taskId));
      setDeleteConfirm(null);
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleChangeTaskStatus = async (taskId: string, status: 'todo' | 'in_progress' | 'completed') => {
    try {
      const response = await client.patch(`/api/tasks/${taskId}/status`, { status });
      setTasks(tasks.map((t) => (t.id === taskId ? response.data.data : t)));
      setChangeStatusTaskId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task status');
    }
  };

  const handleTaskSaved = (savedTask: Task) => {
    if (editingTask) {
      setTasks(tasks.map((t) => (t.id === savedTask.id ? savedTask : t)));
    } else {
      setTasks([savedTask, ...tasks]);
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">Project not found</p>
            <button
              onClick={() => navigate('/projects')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Back to Projects →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Project Header */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {editingName ? (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateProjectName}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNewName(project.name);
                    }}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              )}
              <p className="text-gray-600">{project.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
          </div>

          {/* Project Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => setEditingName(true)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Edit Name
            </button>
            <button
              onClick={() => {
                setDeleteConfirm('project');
              }}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
            >
              Delete Project
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition ml-auto"
            >
              ← Back to Projects
            </button>
          </div>

          {/* Project Meta */}
          <div className="mt-4 text-sm text-gray-500 space-y-1">
            <div>Created: {new Date(project.createdAt).toLocaleDateString()}</div>
            <div>Tasks: {tasks.length}</div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
            <button
              onClick={() => {
                setEditingTask(null);
                setShowTaskModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              + Add Task
            </button>
          </div>

          {/* Task Filters */}
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-600">
                {tasks.length === 0 ? 'No tasks yet. Create one to get started!' : 'No tasks match your filters'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <div key={task.id} className="px-6 py-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(task.status)}`}>
                        {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getPriorityColor(task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <div>
                      {task.dueDate && <span>📅 Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                      {task.assignedTo && <span className="ml-4">👤 Assigned</span>}
                    </div>
                  </div>

                  {/* Task Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium py-1 px-2 rounded hover:bg-blue-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setChangeStatusTaskId(task.id)}
                      className="text-sm text-gray-600 hover:text-gray-900 font-medium py-1 px-2 rounded hover:bg-gray-100 transition"
                    >
                      Change Status
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirm('task');
                        setDeleteConfirmId(task.id);
                      }}
                      className="text-sm text-red-600 hover:text-red-800 font-medium py-1 px-2 rounded hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Status Change Dropdown */}
                  {changeStatusTaskId === task.id && (
                    <div className="mt-3 flex gap-2 p-3 bg-gray-100 rounded">
                      <select
                        value={newTaskStatus}
                        onChange={(e) => setNewTaskStatus(e.target.value as any)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => handleChangeTaskStatus(task.id, newTaskStatus)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => setChangeStatusTaskId(null)}
                        className="px-3 py-1 bg-gray-400 text-white rounded text-sm hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {deleteConfirm === 'project' ? 'Delete Project?' : 'Delete Task?'}
              </h3>
              <p className="text-gray-600 mb-6">
                {deleteConfirm === 'project'
                  ? 'This will delete the project and all associated tasks. This action cannot be undone.'
                  : 'This task will be permanently deleted. This action cannot be undone.'}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setDeleteConfirm(null);
                    setDeleteConfirmId(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirm === 'project') {
                      handleDeleteProject();
                    } else if (deleteConfirmId) {
                      handleDeleteTask(deleteConfirmId);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        task={editingTask}
        projectId={projectId || ''}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSave={handleTaskSaved}
      />
    </div>
  );
};
