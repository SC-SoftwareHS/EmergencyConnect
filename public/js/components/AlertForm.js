/**
 * AlertForm component
 * Form for creating and sending emergency alerts
 */
const AlertForm = ({ user, onAlertCreated }) => {
  const [formData, setFormData] = React.useState({
    title: '',
    message: '',
    severity: 'medium',
    channels: ['email'],
    targeting: {
      roles: ['subscriber'],
      specific: []
    }
  });
  
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);
  
  // Fetch users for targeting
  React.useEffect(() => {
    if (user.role === 'admin') {
      setLoading(true);
      
      api.getUsers()
        .then(response => {
          if (response.success) {
            setUsers(response.data.users);
          } else {
            setError('Failed to fetch users: ' + response.message);
          }
        })
        .catch(err => {
          console.error('Error fetching users:', err);
          setError('An error occurred while fetching users');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user.role]);
  
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
    const { value, checked } = e.target;
    
    setFormData(prev => {
      let updatedChannels;
      
      if (checked) {
        updatedChannels = [...prev.channels, value];
      } else {
        updatedChannels = prev.channels.filter(channel => channel !== value);
      }
      
      return {
        ...prev,
        channels: updatedChannels
      };
    });
  };
  
  // Handle role checkbox changes for targeting
  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      let updatedRoles;
      
      if (checked) {
        updatedRoles = [...prev.targeting.roles, value];
      } else {
        updatedRoles = prev.targeting.roles.filter(role => role !== value);
      }
      
      return {
        ...prev,
        targeting: {
          ...prev.targeting,
          roles: updatedRoles
        }
      };
    });
  };
  
  // Handle specific user selection for targeting
  const handleUserSelection = (e) => {
    const { value, checked } = e.target;
    const userId = parseInt(value);
    
    setFormData(prev => {
      let updatedSpecific;
      
      if (checked) {
        updatedSpecific = [...prev.targeting.specific, userId];
      } else {
        updatedSpecific = prev.targeting.specific.filter(id => id !== userId);
      }
      
      return {
        ...prev,
        targeting: {
          ...prev.targeting,
          specific: updatedSpecific
        }
      };
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      setError('Alert title is required');
      return;
    }
    
    if (!formData.message.trim()) {
      setError('Alert message is required');
      return;
    }
    
    if (formData.channels.length === 0) {
      setError('Select at least one notification channel');
      return;
    }
    
    // Hide previous errors/success
    setError(null);
    setSuccess(null);
    setSending(true);
    
    // Send alert
    api.createAlert(formData)
      .then(response => {
        if (response.success) {
          setSuccess('Alert created and sent successfully!');
          
          // Reset form
          setFormData({
            title: '',
            message: '',
            severity: 'medium',
            channels: ['email'],
            targeting: {
              roles: ['subscriber'],
              specific: []
            }
          });
          
          // Notify parent component
          if (onAlertCreated) {
            onAlertCreated(response.data.alert);
          }
        } else {
          setError(response.message || 'Failed to create alert');
        }
      })
      .catch(err => {
        console.error('Error creating alert:', err);
        setError('An error occurred while creating the alert');
      })
      .finally(() => {
        setSending(false);
      });
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Emergency Alert</h2>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-circle text-red-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-check-circle text-green-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Alert Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a clear, concise title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Alert Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows="4"
            placeholder="Provide detailed information about the emergency"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            required
          ></textarea>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="severity"
                value="low"
                checked={formData.severity === 'low'}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Low</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="severity"
                value="medium"
                checked={formData.severity === 'medium'}
                onChange={handleChange}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Medium</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="severity"
                value="high"
                checked={formData.severity === 'high'}
                onChange={handleChange}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">High</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="severity"
                value="critical"
                checked={formData.severity === 'critical'}
                onChange={handleChange}
                className="h-4 w-4 text-red-900 focus:ring-red-900 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Critical</span>
            </label>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notification Channels *
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="channels"
                value="email"
                checked={formData.channels.includes('email')}
                onChange={handleChannelChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Email</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="channels"
                value="sms"
                checked={formData.channels.includes('sms')}
                onChange={handleChannelChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">SMS</span>
            </label>
            
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="channels"
                value="push"
                checked={formData.channels.includes('push')}
                onChange={handleChannelChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Push Notification</span>
            </label>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Recipients *
          </label>
          
          <div className="bg-gray-50 p-4 rounded-md mb-2">
            <h3 className="text-sm font-medium text-gray-700 mb-2">By Role</h3>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  value="admin"
                  checked={formData.targeting.roles.includes('admin')}
                  onChange={handleRoleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Administrators</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  value="operator"
                  checked={formData.targeting.roles.includes('operator')}
                  onChange={handleRoleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Operators</span>
              </label>
              
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  value="subscriber"
                  checked={formData.targeting.roles.includes('subscriber')}
                  onChange={handleRoleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Subscribers</span>
              </label>
            </div>
          </div>
          
          {user.role === 'admin' && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Specific Users</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="spinner mr-2"></div>
                  <span className="text-sm text-gray-500">Loading users...</span>
                </div>
              ) : users.length > 0 ? (
                <div className="max-h-48 overflow-y-auto">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center py-1">
                      <input
                        type="checkbox"
                        id={`user-${user.id}`}
                        value={user.id}
                        checked={formData.targeting.specific.includes(user.id)}
                        onChange={handleUserSelection}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`user-${user.id}`} className="ml-2 text-sm text-gray-700">
                        {user.username} ({user.email})
                        <span className="ml-1 text-xs text-gray-500">
                          - {user.role}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No users available</p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => onAlertCreated && onAlertCreated()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
          >
            {sending ? (
              <>
                <div className="spinner mr-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2"></i>
                Send Alert
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
