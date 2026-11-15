import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Default mock accounts
const INITIAL_MOCK_USERS = [
  {
    id: 'user-elderly',
    name: 'Eleanor Vance',
    email: 'eleanor@carecircle.org',
    role: 'elderly', // 'elderly' | 'family' | 'caregiver'
    preferredName: 'Grandma Eleanor',
    phone: '+1 (555) 123-4567',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    emergencyContact: '+1 (555) 234-8901 (Sarah Vance)',
    isEmailVerified: true,
  },
  {
    id: 'user-family',
    name: 'Sarah Vance',
    email: 'sarah@carecircle.org',
    role: 'family',
    relation: 'Daughter (Primary Caregiver)',
    phone: '+1 (555) 234-8901',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    isEmailVerified: true,
  },
  {
    id: 'user-nurse',
    name: 'Marcus Bell, RN',
    email: 'marcus@carecircle.org',
    role: 'caregiver',
    organization: 'Oakridge Home Health & Hospice',
    license: 'RN-884920',
    phone: '+1 (555) 456-7890',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=256&q=80',
    isEmailVerified: true,
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('carecircle_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(() => {
    return localStorage.getItem('carecircle_pending_email') || '';
  });

  const [isLoading, setIsLoading] = useState(false);

  // Synchronize user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('carecircle_user', JSON.stringify(user));
      localStorage.setItem('carecircle_token', `mock-jwt-token-${user.id}`);
    } else {
      localStorage.removeItem('carecircle_user');
      localStorage.removeItem('carecircle_token');
    }
  }, [user]);

  // Login handler
  const login = async ({ email, password, role }) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // Simulate network latency

    const targetEmail = email.toLowerCase().trim();
    let found = INITIAL_MOCK_USERS.find((u) => u.email === targetEmail);

    // If not found in defaults, check dynamically registered users in localStorage
    if (!found) {
      const dynamicUsers = JSON.parse(localStorage.getItem('carecircle_dynamic_users') || '[]');
      found = dynamicUsers.find((u) => u.email === targetEmail);
    }

    // Fallback: If demo user logs in with any password or specified role, create session
    if (!found) {
      found = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0].replace('.', ' '),
        email: targetEmail,
        role: role || 'family',
        isEmailVerified: true,
      };
    }

    setUser(found);
    setIsLoading(false);
    return found;
  };

  // Registration handler
  const register = async (userData) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    const newUser = {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      role: userData.role, // 'elderly' | 'family' | 'caregiver'
      preferredName: userData.preferredName || userData.name,
      phone: userData.phone || '',
      relation: userData.relation || '',
      emergencyContact: userData.emergencyContact || '',
      organization: userData.organization || '',
      license: userData.license || '',
      isEmailVerified: false,
    };

    // Store in dynamic users list
    const dynamicUsers = JSON.parse(localStorage.getItem('carecircle_dynamic_users') || '[]');
    dynamicUsers.push(newUser);
    localStorage.setItem('carecircle_dynamic_users', JSON.stringify(dynamicUsers));

    setPendingVerificationEmail(newUser.email);
    localStorage.setItem('carecircle_pending_email', newUser.email);

    setIsLoading(false);
    return newUser;
  };

  // Verify email handler
  const verifyEmail = async (code) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    // Accepts '123456' or any 6-digit code for mock
    if (code.length !== 6) {
      setIsLoading(false);
      throw new Error('Please enter a valid 6-digit verification code.');
    }

    const dynamicUsers = JSON.parse(localStorage.getItem('carecircle_dynamic_users') || '[]');
    let target = dynamicUsers.find((u) => u.email === pendingVerificationEmail);

    if (!target) {
      target = INITIAL_MOCK_USERS[0];
    }

    target = { ...target, isEmailVerified: true };
    setUser(target);
    setPendingVerificationEmail('');
    localStorage.removeItem('carecircle_pending_email');

    setIsLoading(false);
    return target;
  };

  // Forgot password
  const forgotPassword = async (email) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);
    return true;
  };

  // Reset password
  const resetPassword = async (newPassword) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);
    return true;
  };

  // Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('carecircle_user');
    localStorage.removeItem('carecircle_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        pendingVerificationEmail,
        login,
        register,
        verifyEmail,
        forgotPassword,
        resetPassword,
        logout,
        demoUsers: INITIAL_MOCK_USERS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
