import { createContext, useState, useContext, useEffect } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, googleProvider } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // Get Firebase ID token
        const token = await firebaseUser.getIdToken();

        // Store token in localStorage
        localStorage.setItem('firebaseToken', token);

        // Sync with backend
        try {
          const response = await api.post('/auth/firebase-login', {
            idToken: token,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            uid: firebaseUser.uid
          });
          setUser(response.data.user);
        } catch (error) {
          console.error('Error syncing with backend:', error);
        }
      } else {
        localStorage.removeItem('firebaseToken');
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      const response = await api.post('/auth/firebase-login', {
        idToken: token,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        uid: userCredential.user.uid
      });

      setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      const response = await api.post('/auth/firebase-login', {
        idToken: token,
        email: result.user.email,
        displayName: result.user.displayName,
        uid: result.user.uid
      });

      setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, fullName, currencyPreference) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      const response = await api.post('/auth/firebase-register', {
        idToken: token,
        email: userCredential.user.email,
        displayName: fullName,
        uid: userCredential.user.uid,
        currencyPreference
      });

      setUser(response.data.user);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await api.post('/auth/logout');
      localStorage.removeItem('firebaseToken');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    login,
    loginWithGoogle,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
