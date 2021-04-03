import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import api from '../services/api';

interface AuthState {
  token: string;
  user: Record<string, unknown>;
}

interface Credentials {
  email: string;
  password: string;
}

interface AuthContextState {
  user: Record<string, unknown>;
  loading: boolean;
  signIn(credentials: Credentials): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<AuthContextState>({} as AuthContextState);

const AuthProvider: React.FC = ({ children }) => {
  // Executada somente quando tem um refresh na página
  const [data, setData] = useState<AuthState>({} as AuthState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoragedData(): Promise<void> {
      const [token, user] = await AsyncStorage.multiGet([
        '@GoBarber:token',
        '@GoBarber:user',
      ]);

      if (token[1] && user[1]) {
        setData({ token: token[1], user: JSON.parse(user[1]) });
      }

      setLoading(false);
    }
    loadStoragedData();
  }, []);

  const signIn = useCallback(async ({ email, password }: Credentials) => {
    const response = await api.post('session', { email, password });
    const { token, user } = response.data;

    await AsyncStorage.multiSet([
      ['@GoBarber:token', token],
      ['@GoBarber:user', JSON.stringify(user)],
    ]);

    setData({ token, user });
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(['@GoBarber:token', '@GoBarber:user']);

    setData({} as AuthState);
  }, []);

  return (
    <AuthContext.Provider value={{ user: data.user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): AuthContextState {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { AuthProvider, useAuth };
