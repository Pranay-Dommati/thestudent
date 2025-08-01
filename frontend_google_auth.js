/**
 * Google Sign-In Frontend Integration
 * Compatible with existing authentication system
 */

// Option 1: Using Google Identity Services (Recommended)
class GoogleAuth {
    constructor(clientId, backendUrl = 'http://localhost:8000') {
        this.clientId = clientId;
        this.backendUrl = backendUrl;
        this.isInitialized = false;
    }

    // Initialize Google Sign-In
    async initialize() {
        if (this.isInitialized) return;

        // Load Google Identity Services
        await this.loadGoogleScript();
        
        // Initialize Google Sign-In
        google.accounts.id.initialize({
            client_id: this.clientId,
            callback: this.handleGoogleSignIn.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true
        });

        this.isInitialized = true;
    }

    // Load Google Script
    loadGoogleScript() {
        return new Promise((resolve, reject) => {
            if (window.google) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Render Google Sign-In button
    renderButton(elementId, options = {}) {
        const defaultOptions = {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            width: 250
        };

        google.accounts.id.renderButton(
            document.getElementById(elementId),
            { ...defaultOptions, ...options }
        );
    }

    // Handle Google Sign-In response
    async handleGoogleSignIn(response) {
        try {
            console.log('Google Sign-In response received');

            // Send ID token to your backend
            const authResponse = await fetch(`${this.backendUrl}/api/auth/google/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_token: response.credential  // Use ID token for better security
                })
            });

            const data = await authResponse.json();

            if (authResponse.ok) {
                // Authentication successful - same format as regular login
                this.onAuthSuccess(data);
            } else {
                this.onAuthError(data.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Google authentication error:', error);
            this.onAuthError('Network error during authentication');
        }
    }

    // Success callback - integrate with your existing auth handling
    onAuthSuccess(data) {
        console.log('Google authentication successful:', data);

        // Store tokens (same format as your existing login)
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);

        // Store user data
        localStorage.setItem('user', JSON.stringify(data.user));

        // Dispatch custom event for your app to handle
        window.dispatchEvent(new CustomEvent('authSuccess', {
            detail: {
                user: data.user,
                tokens: {
                    access: data.access,
                    refresh: data.refresh
                },
                isNewUser: data.created,
                method: 'google'
            }
        }));

        // Redirect or update UI
        if (data.created) {
            console.log('New user created via Google Sign-In');
            // Maybe show welcome message for new users
        }

        // Redirect to dashboard or update UI
        window.location.href = '/dashboard';
    }

    // Error callback
    onAuthError(error) {
        console.error('Google authentication failed:', error);
        
        // Dispatch error event
        window.dispatchEvent(new CustomEvent('authError', {
            detail: { error, method: 'google' }
        }));

        // Show error message to user
        alert('Google Sign-In failed: ' + error);
    }

    // Prompt user to sign in
    prompt() {
        google.accounts.id.prompt();
    }

    // One-tap sign-in
    enableOneTap() {
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                console.log('One-tap sign-in not available');
            }
        });
    }
}

// React Component Example
const GoogleSignInButton = ({ onSuccess, onError }) => {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const initializeGoogle = async () => {
            const googleAuth = new GoogleAuth('YOUR_GOOGLE_CLIENT_ID');
            await googleAuth.initialize();

            // Override callbacks to integrate with React
            googleAuth.onAuthSuccess = (data) => {
                setIsLoading(false);
                onSuccess?.(data);
            };

            googleAuth.onAuthError = (error) => {
                setIsLoading(false);
                onError?.(error);
            };

            // Render button
            googleAuth.renderButton('google-signin-button', {
                theme: 'filled_blue',
                size: 'large'
            });
        };

        initializeGoogle();
    }, [onSuccess, onError]);

    const handleGoogleSignIn = () => {
        setIsLoading(true);
    };

    return (
        <div>
            <div 
                id="google-signin-button" 
                onClick={handleGoogleSignIn}
                style={{ cursor: isLoading ? 'not-allowed' : 'pointer' }}
            />
            {isLoading && <p>Signing in...</p>}
        </div>
    );
};

// Vanilla JavaScript Usage Example
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Google authentication
    const googleAuth = new GoogleAuth('YOUR_GOOGLE_CLIENT_ID');
    await googleAuth.initialize();

    // Render button
    googleAuth.renderButton('google-signin-button');

    // Listen for auth events
    window.addEventListener('authSuccess', (event) => {
        const { user, tokens, isNewUser, method } = event.detail;
        
        console.log('User authenticated via', method);
        console.log('User data:', user);
        console.log('Is new user:', isNewUser);
        
        // Update your app state
        updateUIForAuthenticatedUser(user);
        
        if (method === 'google' && isNewUser) {
            showWelcomeMessage('Welcome! Your account has been created.');
        }
    });

    window.addEventListener('authError', (event) => {
        const { error, method } = event.detail;
        console.error(`${method} authentication failed:`, error);
        showErrorMessage(`Sign-in failed: ${error}`);
    });
});

// Integration with existing authentication system
class AuthManager {
    constructor() {
        this.googleAuth = new GoogleAuth('YOUR_GOOGLE_CLIENT_ID');
        this.isAuthenticated = false;
        this.user = null;
    }

    async initialize() {
        await this.googleAuth.initialize();
        this.checkExistingAuth();
    }

    // Check if user is already authenticated
    checkExistingAuth() {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            this.user = JSON.parse(userData);
            this.isAuthenticated = true;
            this.updateUI();
        }
    }

    // Regular email/password login (your existing method)
    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.handleAuthSuccess(data, 'email');
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            this.handleAuthError(error.message, 'email');
        }
    }

    // Handle successful authentication (works for both email and Google)
    handleAuthSuccess(data, method) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user', JSON.stringify(data.user));

        this.user = data.user;
        this.isAuthenticated = true;
        this.updateUI();

        console.log(`Authentication successful via ${method}`);
    }

    // Handle authentication errors
    handleAuthError(error, method) {
        console.error(`${method} authentication failed:`, error);
        this.showError(error);
    }

    // Logout
    logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        this.user = null;
        this.isAuthenticated = false;
        this.updateUI();
        
        // Redirect to login page
        window.location.href = '/login';
    }

    // Update UI based on authentication state
    updateUI() {
        if (this.isAuthenticated) {
            document.getElementById('login-section')?.classList.add('hidden');
            document.getElementById('user-section')?.classList.remove('hidden');
            document.getElementById('user-name').textContent = this.user.full_name;
        } else {
            document.getElementById('login-section')?.classList.remove('hidden');
            document.getElementById('user-section')?.classList.add('hidden');
        }
    }

    showError(message) {
        // Implement your error display logic
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }
}

// Usage
const authManager = new AuthManager();
authManager.initialize();

// Override Google auth callbacks to use AuthManager
authManager.googleAuth.onAuthSuccess = (data) => {
    authManager.handleAuthSuccess(data, 'google');
};

authManager.googleAuth.onAuthError = (error) => {
    authManager.handleAuthError(error, 'google');
};

export { GoogleAuth, AuthManager };
