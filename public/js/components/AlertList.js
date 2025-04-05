/**
 * AlertList component
 * Displays a list of alerts with filtering and actions
 */
const AlertList = ({ user }) => {
  const [alerts, setAlerts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [filter, setFilter] = React.useState({
    status: '',
    severity: ''
  });
  const [newAlertIds, setNewAlertIds] = React.useState(new Set());
  
  // Fetch alerts on component mount
  React.useEffect(() => {
    fetchAlerts();
    
    // Listen for new alerts via WebSocket
    socketService.onNewAlert((data) => {
      setAlerts(prevAlerts => {
        // Check if we already have this alert
        const exists = prevAlerts.some(alert => alert.id === data.alert.id);
        
        if (!exists) {
          // Add new alert to the beginning of the list
          setNewAlertIds(prev => new Set(prev).add(data.alert.id));
          return [data.alert, ...prevAlerts];
        }
        
        return prevAlerts;
      });
    });
    
    // Listen for cancelled alerts
    socketService.onAlertCancelled((data) => {
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === data.alertId 
            ? { ...alert, status: 'cancelled' } 
            : alert
        )
      );
    });
    
    // Clean up listeners on unmount
    return () => {
      socketService.offNewAlert();
      socketService.offAlertCancelled();
    };
  }, []);
  
  // Clear highlight effect after 2 seconds
  React.useEffect(() => {
    if (newAlertIds.size > 0) {
      const timer = setTimeout(() => {
        setNewAlertIds(new Set());
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [newAlertIds]);
  
  // Fetch alerts from the API
  const fetchAlerts = () => {
    setLoading(true);
    setError(null);
    
    api.getAlerts()
      .then(response => {
        if (response.success) {
          setAlerts(response.data.alerts);
        } else {
          setError(response.message || 'Failed to fetch alerts');
        }
      })
      .catch(err => {
        console.error('Error fetching alerts:', err);
        setError('An error occurred while fetching alerts');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle cancel alert action
  const handleCancelAlert = (alertId) => {
    if (window.confirm('Are you sure you want to cancel this alert?')) {
      api.cancelAlert(alertId)
        .then(response => {
          if (response.success) {
            // Update the alert in the list
            setAlerts(prevAlerts => 
              prevAlerts.map(alert => 
                alert.id === alertId 
                  ? { ...alert, status: 'cancelled' } 
                  : alert
              )
            );
          } else {
            alert(response.message || 'Failed to cancel alert');
          }
        })
        .catch(err => {
          console.error('Error cancelling alert:', err);
          alert('An error occurred while cancelling the alert');
        });
    }
  };
  
  // Filter alerts based on selected filters
  const filteredAlerts = alerts.filter(alert => {
    if (filter.status && alert.status !== filter.status) {
      return false;
    }
    
    if (filter.severity && alert.severity !== filter.severity) {
      return false;
    }
    
    return true;
  });
  
  // Render loading state
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Loading alerts...</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="fas fa-exclamation-circle text-red-400"></i>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading alerts</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              <button 
                onClick={fetchAlerts}
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
  
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            id="statusFilter"
            name="status"
            value={filter.status}
            onChange={handleFilterChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="severityFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Severity
          </label>
          <select
            id="severityFilter"
            name="severity"
            value={filter.severity}
            onChange={handleFilterChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No alerts match your current filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map(alert => (
            <div 
              key={alert.id} 
              className={`bg-white shadow rounded-lg p-4 alert-card severity-${alert.severity} ${newAlertIds.has(alert.id) ? 'highlight-new' : ''}`}
            >
              <div className="flex justify-between items-start mb-2 alert-card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  {alert.title}
                </h3>
                
                <div className="flex flex-wrap gap-2 alert-card-actions">
                  <span className={`badge badge-${alert.status}`}>
                    {alert.status}
                  </span>
                  
                  <span className={`badge severity-${alert.severity}`} style={{backgroundColor: 'var(--severity-color)', color: 'white'}}>
                    {alert.severity}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 mb-3">{alert.message}</p>
              
              <div className="flex flex-wrap items-center text-sm text-gray-500 mb-2">
                <div className="mr-4">
                  <i className="fas fa-calendar-alt mr-1"></i>
                  {new Date(alert.createdAt).toLocaleString()}
                </div>
                
                <div className="flex items-center">
                  <i className="fas fa-user mr-1"></i>
                  {alert.createdBy}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {alert.channels.map(channel => (
                  <div key={channel} className={`channel-icon channel-${channel}`}>
                    <i className={`fas fa-${channel === 'email' ? 'envelope' : channel === 'sms' ? 'sms' : 'bell'}`}></i>
                  </div>
                ))}
              </div>
              
              {alert.status === 'pending' && (user.isAdmin() || user.role === 'operator') && (
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => handleCancelAlert(alert.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Cancel Alert
                  </button>
                </div>
              )}
              
              {alert.status === 'sent' && (
                <div className="mt-2 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery:</span>
                    <span>
                      {alert.deliveryStats.sent}/{alert.deliveryStats.total} sent 
                      {alert.deliveryStats.failed > 0 && ` (${alert.deliveryStats.failed} failed)`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
