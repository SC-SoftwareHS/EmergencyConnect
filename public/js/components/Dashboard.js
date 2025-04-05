/**
 * Dashboard component
 * Main view for the admin dashboard with role-specific views
 */
const Dashboard = ({ user }) => {
  const [activeTab, setActiveTab] = React.useState('alerts');
  const [alertStats, setAlertStats] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [myAcknowledgments, setMyAcknowledgments] = React.useState([]);
  const incidentContainerRef = React.useRef(null);
  
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
    
    // Listen for alert acknowledgments
    socketService.onAlertAcknowledged((data) => {
      console.log('Alert acknowledged:', data);
      if (user.role === 'admin' || user.role === 'operator') {
        // For admins and operators, refresh the stats
        if (user.role === 'admin') {
          fetchAlertStats();
        }
      }
      
      // If this is the current user's acknowledgment, add it to their list
      if (data.userId === user.id) {
        setMyAcknowledgments(prev => [...prev, data]);
      }
    });
    
    // Cleanup listeners on unmount
    return () => {
      socketService.offNewAlert();
      socketService.offAlertAcknowledged();
    };
  }, [user.role, user.id]);
  
  // Initialize IncidentManagement when tab changes to incidents
  React.useEffect(() => {
    if (activeTab === 'incidents' && incidentContainerRef.current) {
      // Initialize the IncidentManagement component
      IncidentManagement.init('#incident-management-container', user);
      
      // Clean up when component unmounts or tab changes
      return () => {
        IncidentManagement.destroy();
      };
    }
  }, [activeTab, user]);
  
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
  
  // Render the dashboard header with role badge
  const renderDashboardHeader = () => {
    const roleBadgeClass = {
      'admin': 'bg-purple-100 text-purple-800 border-purple-200',
      'operator': 'bg-blue-100 text-blue-800 border-blue-200',
      'subscriber': 'bg-green-100 text-green-800 border-green-200'
    }[user.role] || 'bg-gray-100 text-gray-800 border-gray-200';
    
    const roleIcon = {
      'admin': 'fa-user-shield',
      'operator': 'fa-headset',
      'subscriber': 'fa-user'
    }[user.role] || 'fa-user';
    
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900 mr-3">Dashboard</h1>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadgeClass}`}>
            <i className={`fas ${roleIcon} mr-1`}></i>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        </div>
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
    );
  };
  
  // Render the dashboard stats section for admin
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
  
  // Render the subscriber-specific overview
  const renderSubscriberOverview = () => {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">My Alert Subscription</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800">
            <i className="fas fa-cog mr-1"></i> Manage Preferences
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Notification Channels</h3>
            <div className="space-y-2">
              {Object.entries(user.channels || {}).map(([channel, enabled]) => (
                <div key={channel} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className={`fas fa-${channel === 'email' ? 'envelope' : channel === 'sms' ? 'sms' : 'bell'} text-gray-400 mr-2`}></i>
                    <span className="text-sm">{channel.charAt(0).toUpperCase() + channel.slice(1)}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Acknowledgments</h3>
            {myAcknowledgments.length > 0 ? (
              <div className="space-y-2">
                {myAcknowledgments.slice(0, 3).map((ack, index) => (
                  <div key={index} className="text-sm">
                    <div className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span>Alert #{ack.alertId} acknowledged</span>
                    </div>
                    <div className="text-xs text-gray-500 ml-6">
                      {new Date(ack.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">No recent acknowledgments</div>
            )}
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Subscribed Categories</h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Weather
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Security
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Health
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Transportation
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the operator-specific overview
  const renderOperatorOverview = () => {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Operator Dashboard</h2>
          <div className="text-sm text-gray-500">
            <i className="fas fa-headset mr-1"></i> Emergency Response Team
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('create')}
                className="w-full flex items-center justify-between px-4 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100"
              >
                <span className="flex items-center">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Create New Alert
                </span>
                <i className="fas fa-chevron-right"></i>
              </button>
              <button 
                onClick={() => setActiveTab('incidents')}
                className="w-full flex items-center justify-between px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
              >
                <span className="flex items-center">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  Manage Incidents
                </span>
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Communication Channels</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-3 bg-gray-50 rounded">
                <i className="fas fa-envelope text-2xl text-blue-500 mb-2"></i>
                <div className="text-sm font-medium">Email</div>
                <div className="text-xs text-gray-500">For detailed alerts</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <i className="fas fa-sms text-2xl text-green-500 mb-2"></i>
                <div className="text-sm font-medium">SMS</div>
                <div className="text-xs text-gray-500">For urgent messages</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <i className="fas fa-bell text-2xl text-yellow-500 mb-2"></i>
                <div className="text-sm font-medium">Push</div>
                <div className="text-xs text-gray-500">For mobile users</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <i className="fas fa-users text-2xl text-purple-500 mb-2"></i>
                <div className="text-sm font-medium">Broadcast</div>
                <div className="text-xs text-gray-500">For all recipients</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render role-specific content above the tabs
  const renderRoleSpecificContent = () => {
    switch (user.role) {
      case 'admin':
        return renderStats();
      case 'operator':
        return renderOperatorOverview();
      case 'subscriber':
        return renderSubscriberOverview();
      default:
        return null;
    }
  };
  
  // Render the appropriate tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'create':
        return <AlertForm user={user} onAlertCreated={() => setActiveTab('alerts')} />;
      case 'users':
        return <UserManagement user={user} />;
      case 'incidents':
        return (
          <div id="incident-management-container" ref={incidentContainerRef}>
            <div className="text-center py-8">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading incident management...</p>
            </div>
          </div>
        );
      case 'alerts':
      default:
        return <AlertList user={user} />;
    }
  };
  
  // Render navigation tabs based on user role
  const renderNavTabs = () => {
    return (
      <nav className="flex -mb-px">
        {/* All users can see alerts */}
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
        
        {/* Only admin and operator can see incidents */}
        {(user.isAdmin() || user.role === 'operator') && (
          <button
            onClick={() => setActiveTab('incidents')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'incidents'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <i className="fas fa-exclamation-circle mr-2"></i>
            Incidents
          </button>
        )}
        
        {/* Only admin can see users */}
        {user.isAdmin() && (
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
    );
  };
  
  return (
    <div>
      {renderDashboardHeader()}
      
      {renderRoleSpecificContent()}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          {renderNavTabs()}
        </div>
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
