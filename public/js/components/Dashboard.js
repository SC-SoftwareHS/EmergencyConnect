/**
 * Dashboard component
 * Main view for the admin dashboard
 */
const Dashboard = ({ user }) => {
  const [activeTab, setActiveTab] = React.useState('alerts');
  const [alertStats, setAlertStats] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  
  // Fetch alert statistics for the dashboard
  React.useEffect(() => {
    if (user.role === 'admin') {
      fetchAlertStats();
    }
  }, [user.role]);
  
  // Setup socket listeners for real-time updates
  React.useEffect(() => {
    // Listen for new alerts
    socketService.onNewAlert((data) => {
      // Update stats when a new alert is received
      if (user.role === 'admin') {
        fetchAlertStats();
      }
    });
    
    // Cleanup listeners on unmount
    return () => {
      socketService.offNewAlert();
    };
  }, [user.role]);
  
  // Fetch alert statistics
  const fetchAlertStats = () => {
    setLoading(true);
    setError(null);
    
    api.getAlertAnalytics()
      .then(response => {
        if (response.success) {
          setAlertStats(response.data);
        } else {
          setError(response.message || 'Failed to fetch alert statistics');
        }
      })
      .catch(err => {
        console.error('Error fetching alert statistics:', err);
        setError('An error occurred while fetching alert statistics');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Render the dashboard stats section
  const renderStats = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 p-4 rounded-md my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-circle text-red-400"></i>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading statistics</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (!alertStats) {
      return null;
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Alerts</h3>
          <p className="text-3xl font-bold text-gray-900">{alertStats.alertCounts.total}</p>
          <div className="mt-1 flex space-x-2">
            <span className="badge badge-sent">{alertStats.alertCounts.sent} Sent</span>
            <span className="badge badge-pending">{alertStats.alertCounts.pending} Pending</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Delivery Rate</h3>
          <p className="text-3xl font-bold text-gray-900">{alertStats.deliveryStats.successRate}%</p>
          <div className="mt-1 text-sm text-gray-500">
            {alertStats.deliveryStats.sentNotifications} of {alertStats.deliveryStats.totalRecipients} notifications
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">By Severity</h3>
          <div className="mt-2 space-y-2">
            {Object.entries(alertStats.severityCounts).map(([severity, count]) => (
              <div key={severity} className="flex justify-between items-center">
                <span className={`inline-block w-3 h-3 rounded-full severity-${severity}`} style={{backgroundColor: 'var(--severity-color)'}}></span>
                <span className="text-sm text-gray-600">{severity}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">By Channel</h3>
          <div className="mt-2 space-y-2">
            {Object.entries(alertStats.channelCounts).map(([channel, count]) => (
              <div key={channel} className="flex justify-between items-center">
                <span className={`channel-icon channel-${channel}`}>
                  <i className={`fas fa-${channel === 'email' ? 'envelope' : channel === 'sms' ? 'sms' : 'bell'}`}></i>
                </span>
                <span className="text-sm text-gray-600">{channel}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  // Render the appropriate tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'create':
        return <AlertForm user={user} onAlertCreated={() => setActiveTab('alerts')} />;
      case 'users':
        return <UserManagement user={user} />;
      case 'alerts':
      default:
        return <AlertList user={user} />;
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-4">
          {(user.isAdmin || user.role === 'operator') && (
            <button
              onClick={() => setActiveTab('create')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-sm flex items-center"
            >
              <i className="fas fa-exclamation-triangle mr-2"></i>
              New Alert
            </button>
          )}
        </div>
      </div>
      
      {user.role === 'admin' && renderStats()}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fas fa-bell mr-2"></i>
              Alerts
            </button>
            
            {user.role === 'admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className="fas fa-users mr-2"></i>
                Users
              </button>
            )}
          </nav>
        </div>
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
