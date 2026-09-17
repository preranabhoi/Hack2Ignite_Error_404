import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('civicai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('civicai_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify session on load
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('civicai_token');
      if (savedToken) {
        try {
          const res = await authService.getMe();
          if (res.success) {
            setUser(res.user);
            localStorage.setItem('civicai_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('[CivicAI Auth] Session verification failed:', err.message);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('civicai_token', res.token);
      localStorage.setItem('civicai_user', JSON.stringify(res.user));
    }
    return res;
  };

  const loginCitizen = async (email, password) => {
    const res = await authService.loginCitizen({ email, password });
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('civicai_token', res.token);
      localStorage.setItem('civicai_user', JSON.stringify(res.user));
    }
    return res;
  };

  const loginOfficer = async (email, password) => {
    const res = await authService.loginOfficer({ email, password });
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('civicai_token', res.token);
      localStorage.setItem('civicai_user', JSON.stringify(res.user));
    }
    return res;
  };

  const loginAdmin = async (email, password) => {
    const res = await authService.loginAdmin({ email, password });
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('civicai_token', res.token);
      localStorage.setItem('civicai_user', JSON.stringify(res.user));
    }
    return res;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('civicai_token', res.token);
      localStorage.setItem('civicai_user', JSON.stringify(res.user));
    }
    return res;
  };

  const registerCitizen = async (userData) => {
    const res = await authService.registerCitizen(userData);
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('civicai_token', res.token);
      localStorage.setItem('civicai_user', JSON.stringify(res.user));
    }
    return res;
  };

  const registerOfficer = async (officerData) => {
    const res = await authService.registerOfficer(officerData);
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('civicai_token', res.token);
      localStorage.setItem('civicai_user', JSON.stringify(res.user));
    }
    return res;
  };

  const registerAdmin = async (adminData) => {
    const res = await authService.registerAdmin(adminData);
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('civicai_token', res.token);
      localStorage.setItem('civicai_user', JSON.stringify(res.user));
    }
    return res;
  };

  const demoLogin = async (roleType = 'citizen') => {
    const roleCredentials = {
      citizen: { email: 'citizen@civicai.gov', password: 'password123' },
      officer: { email: 'officer.pwd@civicai.gov', password: 'password123' },
      officerPwd: { email: 'officer.pwd@civicai.gov', password: 'password123' },
      officerWater: { email: 'officer.water@civicai.gov', password: 'password123' },
      waterOfficer: { email: 'officer.water@civicai.gov', password: 'password123' },
      officerElectricity: { email: 'officer.electricity@civicai.gov', password: 'password123' },
      electricityOfficer: { email: 'officer.electricity@civicai.gov', password: 'password123' },
      powerOfficer: { email: 'officer.electricity@civicai.gov', password: 'password123' },
      officerWaste: { email: 'officer.waste@civicai.gov', password: 'password123' },
      wasteOfficer: { email: 'officer.waste@civicai.gov', password: 'password123' },
      admin: { email: 'admin@civicai.gov', password: 'password123' },
    };

    const creds = roleCredentials[roleType] || roleCredentials.citizen;
    return await login(creds.email, creds.password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('civicai_token');
    localStorage.removeItem('civicai_user');
  };

  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    localStorage.setItem('civicai_user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        role: user ? user.role : null,
        isLoading,
        login,
        loginCitizen,
        loginOfficer,
        loginAdmin,
        register,
        registerCitizen,
        registerOfficer,
        registerAdmin,
        demoLogin,
        logout,
        updateUser,
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
