/**
 * AlertList component
 * Displays a list of alerts with filtering and actions
 */
const AlertList = ({ user }) => {
  const [alerts, setAlerts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = React.useState(new Set());
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
    
    // Listen for acknowledged alerts
    socketService.onAlertAcknowledged((data) => {
      // Update alerts with acknowledgment information
      if (user.role === 'admin' || user.role === 'operator') {
        setAlerts(prevAlerts => 
          prevAlerts.map(alert => {
            if (alert.id === data.alertId) {
              // Add acknowledgment to the alert's data
              const acknowledgments = alert.acknowledgments || [];
              return {
                ...alert,
                acknowledgments: [...acknowledgments, {
                  userId: data.userId,
                  timestamp: data.timestamp
                }]
              };
            }
            return alert;
          })
        );
      }
    });
    
    // Clean up listeners on unmount
    return () => {
      socketService.offNewAlert();
      socketService.offAlertCancelled();
      socketService.offAlertAcknowledged();
    };
  }, [user.role]);
  
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
  
  // Handle alert acknowledgment
  const handleAcknowledgeAlert = (alertId) => {
    if (acknowledgedAlerts.has(alertId)) {
      return; // Already acknowledged
    }
    
    // Send acknowledgment via the API
    api.acknowledgeAlert(alertId)
      .then(response => {
        if (response.success) {
          // Update local state to mark as acknowledged
          setAcknowledgedAlerts(prev => new Set(prev).add(alertId));
          
          // Show confirmation toast
          const alertToast = document.createElement('div');
          alertToast.className = 'fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md toast-notification';
          alertToast.innerHTML = `
            <div class="flex items-center">
              <i class="fas fa-check-circle mr-2"></i>
              <p>Alert acknowledged</p>
            </div>
          `;
          document.body.appendChild(alertToast);
          
          // Remove toast after 3 seconds
          setTimeout(() => {
            alertToast.remove();
          }, 3000);
        } else {
          // Show error toast
          const errorToast = document.createElement('div');
          errorToast.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md toast-notification';
          errorToast.innerHTML = `
            <div class="flex items-center">
              <i class="fas fa-exclamation-circle mr-2"></i>
              <p>${response.message || 'Failed to acknowledge alert'}</p>
            </div>
          `;
          document.body.appendChild(errorToast);
          
          // Remove toast after 3 seconds
          setTimeout(() => {
            errorToast.remove();
          }, 3000);
        }
      })
      .catch(err => {
        console.error('Error acknowledging alert:', err);
        
        // Show error toast
        const errorToast = document.createElement('div');
        errorToast.className = 'fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md toast-notification';
        errorToast.innerHTML = `
          <div class="flex items-center">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <p>An error occurred while acknowledging the alert</p>
          </div>
        `;
        document.body.appendChild(errorToast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
          errorToast.remove();
        }, 3000);
      });
  };
  
  // Check if a user has acknowledged an alert
  const hasUserAcknowledged = (alert) => {
    if (acknowledgedAlerts.has(alert.id)) {
      return true;
    }
    
    if (alert.acknowledgments && alert.acknowledgments.some(ack => ack.userId === user.id)) {
      return true;
    }
    
    return false;
  };
  
  // Get acknowledgment count for an alert
  const getAcknowledgmentCount = (alert) => {
    if (!alert.acknowledgments) {
      return 0;
    }
    return alert.acknowledgments.length;
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
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                {alert.status === 'sent' && (
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center">
                      <i className="fas fa-chart-pie mr-1"></i>
                      <span>
                        {alert.deliveryStats.sent}/{alert.deliveryStats.total} sent 
                        {alert.deliveryStats.failed > 0 && ` (${alert.deliveryStats.failed} failed)`}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  {alert.status === 'pending' && (user.role === 'admin' || user.role === 'operator') && (
                    <button
                      onClick={() => handleCancelAlert(alert.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded-md hover:bg-red-50"
                    >
                      <i className="fas fa-ban mr-1"></i>
                      Cancel
                    </button>
                  )}
                  
                  {alert.status === 'sent' && (
                    <>
                      {user.role === 'admin' || user.role === 'operator' ? (
                        <div className="text-sm text-blue-600">
                          <i className="fas fa-check-circle mr-1"></i>
                          {getAcknowledgmentCount(alert)} {getAcknowledgmentCount(alert) === 1 ? 'acknowledgment' : 'acknowledgments'}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          disabled={hasUserAcknowledged(alert)}
                          className={`px-3 py-1 text-sm rounded-md flex items-center ${
                            hasUserAcknowledged(alert)
                              ? 'bg-green-100 text-green-800 cursor-default'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          <i className={`fas ${hasUserAcknowledged(alert) ? 'fa-check' : 'fa-bell'} mr-1`}></i>
                          {hasUserAcknowledged(alert) ? 'Acknowledged' : 'Acknowledge'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Show acknowledgments for admin and operator */}
              {(user.role === 'admin' || user.role === 'operator') && 
               alert.acknowledgments && 
               alert.acknowledgments.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Acknowledgments:</h4>
                  <div className="space-y-1">
                    {alert.acknowledgments.map((ack, index) => (
                      <div key={index} className="text-sm flex items-center text-gray-600">
                        <i className="fas fa-user-check text-green-500 mr-1"></i>
                        <span>User {ack.userId} • {new Date(ack.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* CSS for toast */}
      <style jsx>{`
        .toast-notification {
          z-index: 1000;
          animation: fadeInOut 3s ease-in-out;
        }
        
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(20px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};
