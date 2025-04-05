/**
 * IncidentManagement component
 * Interface for managing and reporting incidents
 */
const IncidentManagement = (() => {
  // Cache DOM elements
  let $container;
  let $incidentForm;
  let $incidentList;
  let $incidentDetails;
  let currentUser;
  let incidents = [];
  let currentIncidentId = null;
  
  // Initialize the component
  const init = (containerSelector, user) => {
    $container = document.querySelector(containerSelector);
    currentUser = user;
    
    if (!$container) {
      console.error('Could not find container element');
      return;
    }
    
    // Set up the incident management UI
    render();
    
    // Set up socket event listeners
    setupSocketListeners();
    
    // Fetch incidents
    fetchIncidents();
  };
  
  // Render the component
  const render = () => {
    $container.innerHTML = `
      <div class="incident-management">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Incident Management</h2>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow">
              <div class="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 class="text-lg font-medium text-gray-900">Incidents</h3>
                <button id="create-incident-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm">Report New</button>
              </div>
              <div class="p-4">
                <div class="mb-4">
                  <select id="incident-filter" class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                    <option value="all">All Incidents</option>
                    <option value="reported">Reported</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div id="incident-list" class="space-y-2">
                  <div class="text-center p-4">
                    <div class="spinner mx-auto"></div>
                    <p class="mt-2 text-gray-600">Loading incidents...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-8">
            <div id="incident-form-container" style="display: none;">
              <div class="card">
                <div class="card-header">
                  <h3>Report Incident</h3>
                </div>
                <div class="card-body">
                  <form id="incident-form">
                    <div class="form-group mb-3">
                      <label for="incident-title">Title</label>
                      <input type="text" id="incident-title" class="form-control" required>
                    </div>
                    
                    <div class="form-group mb-3">
                      <label for="incident-description">Description</label>
                      <textarea id="incident-description" class="form-control" rows="3" required></textarea>
                    </div>
                    
                    <div class="form-group mb-3">
                      <label for="incident-location">Location</label>
                      <input type="text" id="incident-location" class="form-control" required>
                    </div>
                    
                    <div class="form-group mb-3">
                      <label for="incident-severity">Severity</label>
                      <select id="incident-severity" class="form-control" required>
                        <option value="">-- Select Severity --</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    
                    <div class="text-end">
                      <button type="button" id="cancel-incident-btn" class="btn btn-secondary">Cancel</button>
                      <button type="submit" class="btn btn-primary">Submit</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            
            <div id="incident-details-container" style="display: none;">
              <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h3>Incident Details</h3>
                  <div class="btn-group">
                    <button id="create-alert-btn" class="btn btn-sm btn-warning">Create Alert</button>
                    <button id="update-status-btn" class="btn btn-sm btn-primary">Update Status</button>
                  </div>
                </div>
                <div class="card-body">
                  <div id="incident-details"></div>
                  
                  <div class="mt-4">
                    <h4>Response Actions</h4>
                    <div id="incident-responses" class="mb-3"></div>
                    
                    <form id="response-form" class="mb-3">
                      <div class="input-group">
                        <input type="text" id="response-action" class="form-control" placeholder="Add a response action..." required>
                        <button type="submit" class="btn btn-primary">Add</button>
                      </div>
                      <div class="form-text mt-1">
                        <small>Provide a brief description of the action taken in response to this incident.</small>
                      </div>
                    </form>
                  </div>
                  
                  <div class="mt-4">
                    <h4>Timeline</h4>
                    <div id="incident-timeline"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div id="alert-form-container" style="display: none;">
              <div class="card">
                <div class="card-header">
                  <h3>Create Alert from Incident</h3>
                </div>
                <div class="card-body">
                  <form id="alert-from-incident-form">
                    <div class="form-group mb-3">
                      <label for="alert-message">Alert Message</label>
                      <textarea id="alert-message" class="form-control" rows="3" required></textarea>
                    </div>
                    
                    <div class="form-group mb-3">
                      <label>Notification Channels</label>
                      <div class="form-check">
                        <input type="checkbox" id="channel-email" class="form-check-input" value="email" checked>
                        <label for="channel-email" class="form-check-label">Email</label>
                      </div>
                      <div class="form-check">
                        <input type="checkbox" id="channel-sms" class="form-check-input" value="sms">
                        <label for="channel-sms" class="form-check-label">SMS</label>
                      </div>
                      <div class="form-check">
                        <input type="checkbox" id="channel-push" class="form-check-input" value="push">
                        <label for="channel-push" class="form-check-label">Push Notification</label>
                      </div>
                    </div>
                    
                    <div class="form-group mb-3">
                      <label>Target Recipients</label>
                      <div class="form-check">
                        <input type="checkbox" id="role-admin" class="form-check-input" value="admin" checked>
                        <label for="role-admin" class="form-check-label">Administrators</label>
                      </div>
                      <div class="form-check">
                        <input type="checkbox" id="role-operator" class="form-check-input" value="operator" checked>
                        <label for="role-operator" class="form-check-label">Operators</label>
                      </div>
                      <div class="form-check">
                        <input type="checkbox" id="role-subscriber" class="form-check-input" value="subscriber">
                        <label for="role-subscriber" class="form-check-label">Subscribers</label>
                      </div>
                    </div>
                    
                    <div class="text-end">
                      <button type="button" id="cancel-alert-btn" class="btn btn-secondary">Cancel</button>
                      <button type="submit" class="btn btn-warning">Send Alert</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            
            <div id="status-form-container" style="display: none;">
              <div class="card">
                <div class="card-header">
                  <h3>Update Incident Status</h3>
                </div>
                <div class="card-body">
                  <form id="status-form">
                    <div class="form-group mb-3">
                      <label for="incident-status">New Status</label>
                      <select id="incident-status" class="form-control" required>
                        <option value="">-- Select Status --</option>
                        <option value="reported">Reported</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    
                    <div class="form-group mb-3">
                      <label for="status-notes">Notes</label>
                      <textarea id="status-notes" class="form-control" rows="3"></textarea>
                    </div>
                    
                    <div class="text-end">
                      <button type="button" id="cancel-status-btn" class="btn btn-secondary">Cancel</button>
                      <button type="submit" class="btn btn-primary">Update</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Cache DOM elements
    $incidentForm = document.getElementById('incident-form');
    $incidentList = document.getElementById('incident-list');
    $incidentDetails = document.getElementById('incident-details');
    
    // Set up event listeners
    setupEventListeners();
  };
  
  // Set up event listeners
  const setupEventListeners = () => {
    // Create incident button
    const $createBtn = document.getElementById('create-incident-btn');
    if ($createBtn) {
      $createBtn.addEventListener('click', showIncidentForm);
    }
    
    // Cancel incident button
    const $cancelBtn = document.getElementById('cancel-incident-btn');
    if ($cancelBtn) {
      $cancelBtn.addEventListener('click', hideIncidentForm);
    }
    
    // Incident form submission
    if ($incidentForm) {
      $incidentForm.addEventListener('submit', handleIncidentSubmit);
    }
    
    // Incident filter
    const $filter = document.getElementById('incident-filter');
    if ($filter) {
      $filter.addEventListener('change', handleFilterChange);
    }
    
    // Create alert button
    const $createAlertBtn = document.getElementById('create-alert-btn');
    if ($createAlertBtn) {
      $createAlertBtn.addEventListener('click', showAlertForm);
    }
    
    // Cancel alert button
    const $cancelAlertBtn = document.getElementById('cancel-alert-btn');
    if ($cancelAlertBtn) {
      $cancelAlertBtn.addEventListener('click', hideAlertForm);
    }
    
    // Alert form submission
    const $alertForm = document.getElementById('alert-from-incident-form');
    if ($alertForm) {
      $alertForm.addEventListener('submit', handleAlertSubmit);
    }
    
    // Update status button
    const $updateStatusBtn = document.getElementById('update-status-btn');
    if ($updateStatusBtn) {
      $updateStatusBtn.addEventListener('click', showStatusForm);
    }
    
    // Cancel status update button
    const $cancelStatusBtn = document.getElementById('cancel-status-btn');
    if ($cancelStatusBtn) {
      $cancelStatusBtn.addEventListener('click', hideStatusForm);
    }
    
    // Status form submission
    const $statusForm = document.getElementById('status-form');
    if ($statusForm) {
      $statusForm.addEventListener('submit', handleStatusSubmit);
    }
    
    // Response form submission
    const $responseForm = document.getElementById('response-form');
    if ($responseForm) {
      $responseForm.addEventListener('submit', handleResponseSubmit);
    }
  };
  
  // Set up socket listeners
  const setupSocketListeners = () => {
    socketService.onNewIncident(handleNewIncident);
    socketService.onIncidentStatusUpdated(handleIncidentStatusUpdate);
    socketService.onIncidentResponseAdded(handleIncidentResponseAdded);
  };
  
  // Handle new incident from socket
  const handleNewIncident = (data) => {
    // Add incident to the list if it's not already there
    if (!incidents.find(i => i.id === data.incident.id)) {
      incidents.unshift(data.incident);
      renderIncidentList();
    }
  };
  
  // Handle incident status update from socket
  const handleIncidentStatusUpdate = (data) => {
    // Update incident in the list
    const index = incidents.findIndex(i => i.id === data.incident.id);
    if (index !== -1) {
      incidents[index] = data.incident;
      renderIncidentList();
      
      // Update details if currently viewing this incident
      if (currentIncidentId === data.incident.id) {
        renderIncidentDetails(data.incident);
      }
    }
  };
  
  // Handle incident response added from socket
  const handleIncidentResponseAdded = (data) => {
    // Update incident in the list
    const index = incidents.findIndex(i => i.id === data.incident.id);
    if (index !== -1) {
      incidents[index] = data.incident;
      
      // Update details if currently viewing this incident
      if (currentIncidentId === data.incident.id) {
        renderIncidentDetails(data.incident);
      }
    }
  };
  
  // Show incident form
  const showIncidentForm = () => {
    document.getElementById('incident-form-container').style.display = 'block';
    document.getElementById('incident-details-container').style.display = 'none';
    document.getElementById('alert-form-container').style.display = 'none';
    document.getElementById('status-form-container').style.display = 'none';
  };
  
  // Hide incident form
  const hideIncidentForm = () => {
    document.getElementById('incident-form-container').style.display = 'none';
    $incidentForm.reset();
  };
  
  // Show alert form
  const showAlertForm = () => {
    document.getElementById('alert-form-container').style.display = 'block';
    document.getElementById('incident-details-container').style.display = 'none';
    document.getElementById('status-form-container').style.display = 'none';
    
    // Set default alert message based on the current incident
    const incident = incidents.find(i => i.id === currentIncidentId);
    if (incident) {
      document.getElementById('alert-message').value = incident.description;
    }
  };
  
  // Hide alert form
  const hideAlertForm = () => {
    document.getElementById('alert-form-container').style.display = 'none';
    document.getElementById('incident-details-container').style.display = 'block';
  };
  
  // Show status form
  const showStatusForm = () => {
    document.getElementById('status-form-container').style.display = 'block';
    document.getElementById('incident-details-container').style.display = 'none';
    document.getElementById('alert-form-container').style.display = 'none';
    
    // Set current status as default
    const incident = incidents.find(i => i.id === currentIncidentId);
    if (incident) {
      document.getElementById('incident-status').value = incident.status;
    }
  };
  
  // Hide status form
  const hideStatusForm = () => {
    document.getElementById('status-form-container').style.display = 'none';
    document.getElementById('incident-details-container').style.display = 'block';
  };
  
  // Handle incident form submission
  const handleIncidentSubmit = async (event) => {
    event.preventDefault();
    
    const incidentData = {
      title: document.getElementById('incident-title').value,
      description: document.getElementById('incident-description').value,
      location: document.getElementById('incident-location').value,
      severity: document.getElementById('incident-severity').value
    };
    
    try {
      const response = await api.createIncident(incidentData);
      
      if (response.success) {
        // Add incident to the list
        incidents.unshift(response.data.incident);
        renderIncidentList();
        
        // Hide form and show details
        hideIncidentForm();
        showIncidentDetails(response.data.incident.id);
        
        // Show success message
        showToast('Success', 'Incident reported successfully.');
      } else {
        showToast('Error', response.message || 'Failed to report incident.');
      }
    } catch (error) {
      console.error('Error reporting incident:', error);
      showToast('Error', 'Failed to report incident. Please try again.');
    }
  };
  
  // Handle incident filter change
  const handleFilterChange = () => {
    renderIncidentList();
  };
  
  // Handle alert form submission
  const handleAlertSubmit = async (event) => {
    event.preventDefault();
    
    const channels = [
      ...document.querySelectorAll('input[id^="channel-"]:checked')
    ].map(checkbox => checkbox.value);
    
    const roles = [
      ...document.querySelectorAll('input[id^="role-"]:checked')
    ].map(checkbox => checkbox.value);
    
    const alertData = {
      message: document.getElementById('alert-message').value,
      channels,
      targeting: {
        roles,
        specific: []
      }
    };
    
    try {
      const response = await api.createAlertFromIncident(currentIncidentId, alertData);
      
      if (response.success) {
        // Hide form and show details
        hideAlertForm();
        showIncidentDetails(currentIncidentId);
        
        // Show success message
        showToast('Success', 'Alert created and sent successfully.');
      } else {
        showToast('Error', response.message || 'Failed to create alert.');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      showToast('Error', 'Failed to create alert. Please try again.');
    }
  };
  
  // Handle status form submission
  const handleStatusSubmit = async (event) => {
    event.preventDefault();
    
    const statusData = {
      status: document.getElementById('incident-status').value,
      notes: document.getElementById('status-notes').value
    };
    
    try {
      const response = await api.updateIncidentStatus(currentIncidentId, statusData);
      
      if (response.success) {
        // Update incident in the list
        const index = incidents.findIndex(i => i.id === currentIncidentId);
        if (index !== -1) {
          incidents[index] = response.data.incident;
          renderIncidentList();
        }
        
        // Hide form and show details
        hideStatusForm();
        renderIncidentDetails(response.data.incident);
        
        // Show success message
        showToast('Success', 'Incident status updated successfully.');
      } else {
        showToast('Error', response.message || 'Failed to update incident status.');
      }
    } catch (error) {
      console.error('Error updating incident status:', error);
      showToast('Error', 'Failed to update incident status. Please try again.');
    }
  };
  
  // Handle response form submission
  const handleResponseSubmit = async (event) => {
    event.preventDefault();
    
    const responseData = {
      action: document.getElementById('response-action').value,
      notes: ''
    };
    
    try {
      const response = await api.addIncidentResponse(currentIncidentId, responseData);
      
      if (response.success) {
        // Update incident in the list
        const index = incidents.findIndex(i => i.id === currentIncidentId);
        if (index !== -1) {
          incidents[index] = response.data.incident;
        }
        
        // Clear form and render updated details
        document.getElementById('response-action').value = '';
        renderIncidentDetails(response.data.incident);
        
        // Show success message
        showToast('Success', 'Response added successfully.');
      } else {
        showToast('Error', response.message || 'Failed to add response.');
      }
    } catch (error) {
      console.error('Error adding response:', error);
      showToast('Error', 'Failed to add response. Please try again.');
    }
  };
  
  // Fetch incidents from the API
  const fetchIncidents = async () => {
    try {
      const response = await api.getIncidents();
      
      if (response.success) {
        incidents = response.data.incidents;
        renderIncidentList();
      } else {
        $incidentList.innerHTML = '<div class="alert alert-danger">Failed to load incidents.</div>';
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      $incidentList.innerHTML = '<div class="alert alert-danger">Failed to load incidents.</div>';
    }
  };
  
  // Render incident list
  const renderIncidentList = () => {
    const filter = document.getElementById('incident-filter').value;
    
    // Filter incidents by status
    let filteredIncidents = incidents;
    if (filter !== 'all') {
      filteredIncidents = incidents.filter(incident => incident.status === filter);
    }
    
    if (filteredIncidents.length === 0) {
      $incidentList.innerHTML = '<div class="text-center p-3">No incidents found.</div>';
      return;
    }
    
    // Sort incidents by reportedAt (newest first)
    filteredIncidents.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
    
    // Generate HTML for each incident
    const html = filteredIncidents.map(incident => `
      <a href="#" class="list-group-item list-group-item-action incident-item ${currentIncidentId === incident.id ? 'active' : ''}" 
         data-id="${incident.id}">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">${incident.title}</h5>
          <small class="text-${getSeverityClass(incident.severity)}">${incident.severity.toUpperCase()}</small>
        </div>
        <div class="d-flex w-100 justify-content-between">
          <small>${incident.location}</small>
          <span class="badge bg-${getStatusClass(incident.status)}">${formatStatus(incident.status)}</span>
        </div>
        <small>${formatDate(incident.reportedAt)}</small>
      </a>
    `).join('');
    
    $incidentList.innerHTML = html;
    
    // Add event listeners for incident items
    document.querySelectorAll('.incident-item').forEach(item => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        const id = parseInt(item.dataset.id);
        showIncidentDetails(id);
      });
    });
  };
  
  // Show incident details
  const showIncidentDetails = async (id) => {
    currentIncidentId = id;
    
    // Update active state in the list
    document.querySelectorAll('.incident-item').forEach(item => {
      if (parseInt(item.dataset.id) === id) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Get incident from the list
    let incident = incidents.find(i => i.id === id);
    
    // If not found in the list, fetch from API
    if (!incident) {
      try {
        const response = await api.getIncidentById(id);
        
        if (response.success) {
          incident = response.data.incident;
          
          // Add to the list if not already there
          if (!incidents.find(i => i.id === incident.id)) {
            incidents.push(incident);
          }
        } else {
          $incidentDetails.innerHTML = '<div class="alert alert-danger">Failed to load incident details.</div>';
          return;
        }
      } catch (error) {
        console.error('Error fetching incident details:', error);
        $incidentDetails.innerHTML = '<div class="alert alert-danger">Failed to load incident details.</div>';
        return;
      }
    }
    
    // Show details container
    document.getElementById('incident-details-container').style.display = 'block';
    document.getElementById('incident-form-container').style.display = 'none';
    document.getElementById('alert-form-container').style.display = 'none';
    document.getElementById('status-form-container').style.display = 'none';
    
    // Render incident details
    renderIncidentDetails(incident);
  };
  
  // Render incident details
  const renderIncidentDetails = (incident) => {
    // Determine if user can update status (admin or operator)
    const canUpdate = currentUser.isAdmin || currentUser.isOperator;
    
    // Render details
    $incidentDetails.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2>${incident.title}</h2>
        <span class="badge bg-${getStatusClass(incident.status)} fs-6">${formatStatus(incident.status)}</span>
      </div>
      
      <div class="row mb-3">
        <div class="col-md-6">
          <p><strong>Reported by:</strong> User ID ${incident.reportedBy}</p>
          <p><strong>Location:</strong> ${incident.location}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Severity:</strong> <span class="text-${getSeverityClass(incident.severity)}">${incident.severity.toUpperCase()}</span></p>
          <p><strong>Reported at:</strong> ${formatDate(incident.reportedAt)}</p>
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-body">
          <h5 class="card-title">Description</h5>
          <p class="card-text">${incident.description}</p>
        </div>
      </div>
      
      ${incident.relatedAlertId ? `
        <div class="alert alert-warning">
          <strong>Alert issued:</strong> This incident has an associated alert (ID: ${incident.relatedAlertId}).
        </div>
      ` : ''}
    `;
    
    // Hide buttons if user cannot update
    if (!canUpdate) {
      document.getElementById('create-alert-btn').style.display = 'none';
      document.getElementById('update-status-btn').style.display = 'none';
      document.getElementById('response-form').style.display = 'none';
    } else {
      document.getElementById('create-alert-btn').style.display = 'inline-block';
      document.getElementById('update-status-btn').style.display = 'inline-block';
      document.getElementById('response-form').style.display = 'block';
    }
    
    // Render responses
    renderIncidentResponses(incident);
    
    // Render timeline
    renderIncidentTimeline(incident);
  };
  
  // Render incident responses
  const renderIncidentResponses = (incident) => {
    const $responses = document.getElementById('incident-responses');
    
    if (!incident.responses || incident.responses.length === 0) {
      $responses.innerHTML = '<div class="alert alert-info">No responses have been recorded yet.</div>';
      return;
    }
    
    const html = incident.responses.map(response => `
      <div class="card mb-2">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="card-title mb-0">${response.action}</h6>
            <small>${formatDate(response.timestamp)}</small>
          </div>
          ${response.notes ? `<p class="card-text mt-2">${response.notes}</p>` : ''}
          <small class="text-muted">By User ${response.userId}</small>
        </div>
      </div>
    `).join('');
    
    $responses.innerHTML = html;
  };
  
  // Render incident timeline
  const renderIncidentTimeline = (incident) => {
    const $timeline = document.getElementById('incident-timeline');
    
    if (!incident.timeline || incident.timeline.length === 0) {
      $timeline.innerHTML = '<div class="alert alert-info">No timeline events recorded.</div>';
      return;
    }
    
    // Sort timeline by timestamp
    const sortedTimeline = [...incident.timeline].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    const html = sortedTimeline.map(event => `
      <div class="timeline-item card mb-2">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-0">${formatTimelineAction(event.action)}</h6>
            <small>${formatDate(event.timestamp)}</small>
          </div>
          ${event.notes ? `<p class="card-text mt-2">${event.notes}</p>` : ''}
          <small class="text-muted">By User ${event.userId}</small>
        </div>
      </div>
    `).join('');
    
    $timeline.innerHTML = html;
  };
  
  // Format timeline action for display
  const formatTimelineAction = (action) => {
    if (action === 'reported') {
      return 'Incident Reported';
    }
    
    if (action.startsWith('status_changed_to_')) {
      const status = action.replace('status_changed_to_', '');
      return `Status Changed to ${formatStatus(status)}`;
    }
    
    if (action.startsWith('response_')) {
      const response = action.replace('response_', '');
      return `Response: ${response}`;
    }
    
    return action;
  };
  
  // Get severity CSS class
  const getSeverityClass = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'primary';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };
  
  // Get status CSS class
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'reported':
        return 'info';
      case 'investigating':
        return 'warning';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'secondary';
      default:
        return 'light';
    }
  };
  
  // Format status for display
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Show toast notification
  const showToast = (title, message) => {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.setAttribute('id', toastId);
    
    // Set toast content
    toast.innerHTML = `
      <div class="toast-header">
        <strong class="me-auto">${title}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Initialize Bootstrap toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  };
  
  // Clean up event listeners when destroying the component
  const destroy = () => {
    socketService.offNewIncident();
    socketService.offIncidentStatusUpdated();
    socketService.offIncidentResponseAdded();
  };
  
  // Return public methods
  return {
    init,
    destroy
  };
})();