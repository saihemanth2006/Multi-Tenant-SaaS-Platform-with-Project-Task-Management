import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'tenant_admin';
  isActive: boolean;
  createdAt: string;
}

interface UserModalProps {
  isOpen: boolean;
  user?: User | null;
  onClose: () => void;
  onSave: (user: User) => void;
}

export default function UserModal({ isOpen, user, onClose, onSave }: UserModalProps) {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState<{
    email: string;
    fullName: string;
    password: string;
    role: 'user' | 'tenant_admin';
    isActive: boolean;
  }>({
    email: '',
    fullName: '',
    password: '',
    role: 'user',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        // Editing existing user
        setFormData({
          email: user.email,
          fullName: user.fullName,
          password: '', // Don't pre-fill password
          role: user.role,
          isActive: user.isActive
        });
      } else {
        // Creating new user
        setFormData({
          email: '',
          fullName: '',
          password: '',
          role: 'user',
          isActive: true
        });
      }
      setErrors({});
      setError(null);
    }
  }, [isOpen, user]);

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Password validation
    if (!user) {
      // Creating new user - password required
      if (!formData.password.trim()) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
    } else {
      // Editing user - password optional
      if (formData.password && formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let response;
      if (user) {
        // Update existing user
        const updateData: any = {
          fullName: formData.fullName,
          role: formData.role,
          isActive: formData.isActive
        };

        // Only include password if provided
        if (formData.password.trim()) {
          updateData.password = formData.password;
        }

        response = await client.put(`/api/users/${user.id}`, updateData);
      } else {
        // Create new user
        response = await client.post(`/api/tenants/${currentUser?.tenant?.id}/users`, {
          email: formData.email,
          fullName: formData.fullName,
          password: formData.password,
          role: formData.role
        });
      }

      const savedUser = response.data.data || response.data;
      onSave(savedUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save user';
      setError(message);
      console.error('Error saving user:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {user ? 'Edit User' : 'Add User'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              disabled={!!user} // Disable email edit for existing users
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Full Name field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                if (errors.fullName) setErrors({ ...errors, fullName: '' });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="John Doe"
            />
            {errors.fullName && (
              <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password {user ? '(optional)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={user ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
            />
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
            {user && (
              <p className="text-gray-500 text-xs mt-1">
                Only fill in if you want to change the password
              </p>
            )}
          </div>

          {/* Role field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as 'user' | 'tenant_admin'
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">User</option>
              <option value="tenant_admin">Admin</option>
            </select>
          </div>

          {/* Active status field */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
