/**
 * UserManagement component
 * Admin interface for managing users and their roles
 */
const UserManagement = ({ user }) => {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [editingUser, setEditingUser] = React.useState(null);
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
    role: 'subscriber',
    phoneNumber: '',
    channels: {
      email: true,
      sms: false,
      push: false
    },
    categories: []
  });
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [submitLoading, setSubmitLoading] = React.useState(false);
  const [submitError, setSubmitError] = React.useState(null);
  const [submitSuccess, setSubmitSuccess] = React.useState(null);
  
  // Fetch users on component mount
  React.useEffect(() => {
    fetchUsers();
  }, []);
  
  // Reset form when changing between add/edit modes
  React.useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username || '',
        email: editingUser.email || '',
        password: '', // Don't populate password field for security
        role: editingUser.role || 'subscriber',
        phoneNumber: editingUser.phoneNumber || '',
        channels: editingUser.channels || {
          email: true,
          sms: false,
          push: false
        },
        categories: editingUser.subscription?.categories || []
      });
    } else if (showAddForm) {
      // Reset form for adding new user
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'subscriber',
        phoneNumber: '',
        channels: {
          email: true,
          sms: false,
          push: false
        },
        categories: []
      });
    }
  }, [editingUser, showAddForm]);
  
  // Fetch users from the API
  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    
    api.getUsers()
      .then(response => {
        if (response.success) {
          setUsers(response.data.users);
        } else {
          setError(response.message || 'Failed to fetch users');
        }
      })
      .catch(err => {
        console.error('Error fetching users:', err);
        setError('An error occurred while fetching users');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle channel checkbox changes
  const handleChannelChange = (e) => {
    const { name, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [name]: checked
      }
    }));
  };
  
  // Handle category checkbox changes
  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      let updatedCategories;
      
      if (checked) {
        updatedCategories = [...prev.categories, value];
      } else {
        updatedCategories = prev.categories.filter(cat => cat !== value);
      }
      
      return {
        ...prev,
        categories: updatedCategories
      };
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.username.trim()) {
      setSubmitError('Username is required');
      return;
    }
    
    if (!formData.email.trim()) {
      setSubmitError('Email is required');
      return;
    }
    
    // When adding a new user, password is required
    if (!editingUser && !formData.password.trim()) {
      setSubmitError('Password is required');
      return;
    }
    
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    
    if (editingUser) {
      // Update existing user
      const updateData = { ...formData };
      
      // Don't send empty password
      if (!updateData.password) {
        delete updateData.password;
      }
      
      api.updateUser(editingUser.id, updateData)
        .then(response => {
          if (response.success) {
            setSubmitSuccess('User updated successfully');
            
            // Update users list
            setUsers(prev => 
              prev.map(user => 
                user.id === editingUser.id ? response.data.user : user
              )
            );
            
            // Close form after a short delay
            setTimeout(() => {
              setEditingUser(null);
              setShowAddForm(false);
              setSubmitSuccess(null);
            }, 2000);
          } else {
            setSubmitError(response.message || 'Failed to update user');
          }
        })
        .catch(err => {
          console.error('Error updating user:', err);
          setSubmitError('An error occurred while updating the user');
        })
        .finally(() => {
          setSubmitLoading(false);
        });
    } else {
      // Create new user
      api.createUser(formData)
        .then(response => {
          if (response.success) {
            setSubmitSuccess('User created successfully');
            
            // Update users list
            setUsers(prev => [...prev, response.data.user]);
            
            // Close form after a short delay
            setTimeout(() => {
              setShowAddForm(false);
              setSubmitSuccess(null);
            }, 2000);
          } else {
            setSubmitError(response.message || 'Failed to create user');
          }
        })
        .catch(err => {
          console.error('Error creating user:', err);
          setSubmitError('An error occurred while creating the user');
        })
        .finally(() => {
          setSubmitLoading(false);
        });
    }
  };
  
  // Handle user deletion
  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      api.deleteUser(userId)
        .then(response => {
          if (response.success) {
            // Update users list
            setUsers(prev => prev.filter(user => user.id !== userId));
            
            alert('User deleted successfully');
          } else {
            alert(response.message || 'Failed to delete user');
          }
        })
        .catch(err => {
          console.error('Error deleting user:', err);
          alert('An error occurred while deleting the user');
        });
    }
  };
  
  // Render loading state
  if (loading && users.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Loading users...</p>
      </div>
    );
  }
  
  // Render error state
  if (error && users.length === 0) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="fas fa-exclamation-circle text-red-400"></i>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading users</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              <button 
                onClick={fetchUsers}
                className="mt-2 text-red-700 font-medium hover:text-red-900"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render form for adding/editing users
  const renderForm = () => {
    return (
      <div className="bg-white p-6 shadow-sm rounded-lg mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {editingUser ? 'Edit User' : 'Add New User'}
        </h3>
        
        {submitError && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-circle text-red-400"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            </div>
          </div>
        )}
        
        {submitSuccess && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-check-circle text-green-400"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{submitSuccess}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password {!editingUser && '*'}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder={editingUser ? "Leave blank to keep current password" : ""}
                required={!editingUser}
              />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                required
              >
                <option value="subscriber">Subscriber</option>
                <option value="operator">Operator</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="+15551234567"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Notification Channels</h4>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="email"
                  checked={formData.channels.email}
                  onChange={handleChannelChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Email</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="sms"
                  checked={formData.channels.sms}
                  onChange={handleChannelChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">SMS</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="push"
                  checked={formData.channels.push}
                  onChange={handleChannelChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Push Notification</span>
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Alert Categories</h4>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  value="weather"
                  checked={formData.categories.includes('weather')}
                  onChange={handleCategoryChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Weather</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  value="security"
                  checked={formData.categories.includes('security')}
                  onChange={handleCategoryChange}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Security</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  value="health"
                  checked={formData.categories.includes('health')}
                  onChange={handleCategoryChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Health</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  value="transportation"
                  checked={formData.categories.includes('transportation')}
                  onChange={handleCategoryChange}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Transportation</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setEditingUser(null);
                setShowAddForm(false);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
            >
              {submitLoading ? (
                <>
                  <div className="spinner mr-2 border-white"></div>
                  {editingUser ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <i className={`fas fa-${editingUser ? 'save' : 'plus'} mr-2`}></i>
                  {editingUser ? 'Update User' : 'Create User'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        
        {!showAddForm && !editingUser && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
          >
            <i className="fas fa-user-plus mr-2"></i>
            Add User
          </button>
        )}
      </div>
      
      {(showAddForm || editingUser) && renderForm()}
      
      {users.length > 0 ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notification Channels
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <i className="fas fa-user text-gray-500"></i>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : user.role === 'operator'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {user.channels?.email && (
                        <span className="channel-icon channel-email" title="Email">
                          <i className="fas fa-envelope"></i>
                        </span>
                      )}
                      {user.channels?.sms && (
                        <span className="channel-icon channel-sms" title="SMS">
                          <i className="fas fa-sms"></i>
                        </span>
                      )}
                      {user.channels?.push && (
                        <span className="channel-icon channel-push" title="Push">
                          <i className="fas fa-bell"></i>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <i className="fas fa-trash-alt mr-1"></i>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found. Add a new user to get started.</p>
        </div>
      )}
    </div>
  );
};
