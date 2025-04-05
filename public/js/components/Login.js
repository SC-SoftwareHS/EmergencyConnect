/**
 * Login component
 * Handles user authentication
 */
const Login = ({ onLoginSuccess }) => {
  const [formData, setFormData] = React.useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [isRegister, setIsRegister] = React.useState(false);
  const [registerFormData, setRegisterFormData] = React.useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  });
  
  // Handle login form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle register form input changes
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle login form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Call login API
    api.login(formData.email, formData.password)
      .then(response => {
        if (response.success) {
          onLoginSuccess(response.data.user, response.data.token);
        } else {
          setError(response.message || 'Invalid email or password');
        }
      })
      .catch(err => {
        console.error('Login error:', err);
        setError('An error occurred during login. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Handle register form submission
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!registerFormData.username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (!registerFormData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!registerFormData.password.trim()) {
      setError('Password is required');
      return;
    }
    
    if (registerFormData.password !== registerFormData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (registerFormData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Call register API
    api.register({
      username: registerFormData.username,
      email: registerFormData.email,
      password: registerFormData.password,
      phoneNumber: registerFormData.phoneNumber || null
    })
      .then(response => {
        if (response.success) {
          onLoginSuccess(response.data.user, response.data.token);
        } else {
          setError(response.message || 'Registration failed');
        }
      })
      .catch(err => {
        console.error('Registration error:', err);
        setError('An error occurred during registration. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Toggle between login and register forms
  const toggleForm = () => {
    setIsRegister(!isRegister);
    setError(null);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Emergency Alert System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegister ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
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
        
        {isRegister ? (
          <form className="mt-8 space-y-6" onSubmit={handleRegisterSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="register-username" className="sr-only">Username</label>
                <input
                  id="register-username"
                  name="username"
                  type="text"
                  required
                  value={registerFormData.username}
                  onChange={handleRegisterChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                />
              </div>
              <div>
                <label htmlFor="register-email" className="sr-only">Email address</label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={registerFormData.email}
                  onChange={handleRegisterChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="register-password" className="sr-only">Password</label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={registerFormData.password}
                  onChange={handleRegisterChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Password (minimum 8 characters)"
                />
              </div>
              <div>
                <label htmlFor="register-confirm-password" className="sr-only">Confirm Password</label>
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={registerFormData.confirmPassword}
                  onChange={handleRegisterChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm password"
                />
              </div>
              <div>
                <label htmlFor="register-phone" className="sr-only">Phone Number (optional)</label>
                <input
                  id="register-phone"
                  name="phoneNumber"
                  type="tel"
                  value={registerFormData.phoneNumber}
                  onChange={handleRegisterChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Phone number (optional, for SMS alerts)"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {loading ? (
                  <>
                    <div className="spinner mr-2 border-white"></div>
                    Registering...
                  </>
                ) : (
                  <>
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <i className="fas fa-user-plus text-red-500 group-hover:text-red-400"></i>
                    </span>
                    Register
                  </>
                )}
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={toggleForm}
                className="text-sm text-red-600 hover:text-red-500"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {loading ? (
                  <>
                    <div className="spinner mr-2 border-white"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <i className="fas fa-sign-in-alt text-red-500 group-hover:text-red-400"></i>
                    </span>
                    Sign in
                  </>
                )}
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={toggleForm}
                className="text-sm text-red-600 hover:text-red-500"
              >
                Don't have an account? Register
              </button>
            </div>
          </form>
        )}
        
        <div className="border-t border-gray-200 pt-4">
          <div className="text-center text-sm text-gray-600">
            <p>Demo credentials:</p>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="border border-gray-200 rounded p-2">
                <p className="font-semibold">Admin</p>
                <p>admin@example.com</p>
                <p>admin123</p>
              </div>
              <div className="border border-gray-200 rounded p-2">
                <p className="font-semibold">Operator</p>
                <p>operator@example.com</p>
                <p>operator123</p>
              </div>
              <div className="border border-gray-200 rounded p-2">
                <p className="font-semibold">Subscriber</p>
                <p>subscriber@example.com</p>
                <p>subscriber123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
