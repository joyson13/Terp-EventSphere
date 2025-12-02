import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { userService } from '../services/api'
import api from '../services/api'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'
import { FiTrash2, FiSave, FiX } from 'react-icons/fi'

const AdminPage = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await userService.getAllUsers()
      setUsers(response.data)
    } catch (error) {
      toast.error('Failed to load users')
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (userId, newRole) => {
    setEditingUser(userId)
    setSelectedRole(newRole)
  }

  const handleSaveRole = async (userId) => {
    try {
      // Use the update user endpoint
      const userServiceUrl = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001'
      await api.put(`${userServiceUrl}/api/users/${userId}`, { role: selectedRole })
      toast.success('User role updated successfully')
      setEditingUser(null)
      setSelectedRole('')
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update role')
    }
  }

  const handleDeleteUser = async (userId) => {
    try {
      await userService.deleteUser(userId)
      toast.success('User deleted successfully')
      setDeleteConfirm(null)
      fetchUsers()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    }
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">User Management</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">All Users</h2>

            {users.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((userItem) => (
                      <tr key={userItem.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {userItem.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">{userItem.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser === userItem.user_id ? (
                            <div className="flex items-center space-x-2">
                              <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:ring-maryland-red focus:border-maryland-red dark:bg-gray-700 dark:text-white"
                              >
                                <option value="participant">Participant</option>
                                <option value="event_organizer">Event Organizer</option>
                                <option value="administrator">Administrator</option>
                              </select>
                              <button
                                onClick={() => handleSaveRole(userItem.user_id)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                <FiSave />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUser(null)
                                  setSelectedRole('')
                                }}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                <FiX />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 capitalize">
                                {userItem.role}
                              </span>
                              <button
                                onClick={() => handleRoleChange(userItem.user_id, userItem.role)}
                                className="text-maryland-red hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                              >
                                Change
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {deleteConfirm === userItem.user_id ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-red-600 dark:text-red-400 text-sm">Confirm delete?</span>
                              <button
                                onClick={() => handleDeleteUser(userItem.user_id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <FiTrash2 />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                <FiX />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(userItem.user_id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <FiTrash2 className="inline mr-1" />
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage

