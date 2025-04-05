/**
 * Main App component
 * Handles authentication state and routing
 */
const App = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  // Check if user is already logged in
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      setLoading(true);
      
      // Fetch user profile
      api.getProfile()
        .then(response => {
          if (response.success) {
            setUser(response.data.user);
            
            // Connect to the WebSocket server
            socketService.connect(response.data.user.id);
          } else {
            // Clear token if invalid
            localStorage.removeItem('token');
          }
        })
        .catch(error => {
          console.error('Failed to get user profile:', error);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);
  
  // Handle login success
  const handleLoginSuccess = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
    
    // Connect to the WebSocket server
    socketService.connect(userData.id);
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    
    // Disconnect from the WebSocket server
    socketService.disconnect();
  };
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show login screen if user is not logged in
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }
  
  // User is logged in, show the dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="container mx-auto py-6 px-4">
        <Dashboard user={user} />
      </main>
      
      <footer className="bg-white py-4 text-center text-gray-500 text-sm">
        <div className="container mx-auto">
          <p>Emergency Alert System &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};
