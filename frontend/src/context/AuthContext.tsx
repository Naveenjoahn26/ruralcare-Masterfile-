import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

export type UserRole = "PHC" | "ADMIN" | "HOSPITAL" | null;

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  phcId?: string;
  hospitalId?: string;
  userName: string;
  roleTitle: string;
  facilityName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  phcId: string;
  hospitalId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const phcId = user?.phcId || "";
  const hospitalId = user?.hospitalId || "";
  const isAuthenticated = !!user;

  useEffect(() => {
    const validateToken = async () => {
      try {
        const userData = await api.getMe();
        setUser({
          id: userData.id,
          username: userData.username,
          role: userData.role as UserRole,
          phcId: userData.role === "PHC" ? userData.facility_id : undefined,
          hospitalId: userData.role === "HOSPITAL" ? userData.facility_id : undefined,
          userName: userData.full_name,
          roleTitle: userData.role === "PHC" ? "Primary Health Center Staff" : userData.role === "HOSPITAL" ? "District Hospital Specialist" : "Central Command Admin",
          facilityName: userData.facility_id || "State Health Mission Hub",
        });
      } catch (error) {
        console.error("Token validation failed:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.login({ username, password });
    const { user: userData } = res;
    setUser({
      id: userData.id,
      username: userData.username,
      role: userData.role as UserRole,
      phcId: userData.role === "PHC" ? userData.facility_id : undefined,
      hospitalId: userData.role === "HOSPITAL" ? userData.facility_id : undefined,
      userName: userData.full_name,
      roleTitle: userData.role === "PHC" ? "Primary Health Center Staff" : userData.role === "HOSPITAL" ? "District Hospital Specialist" : "Central Command Admin",
      facilityName: userData.facility_id || "State Health Mission Hub",
    });
  };

  const logout = () => {
    // Invalidate cookie on server and clear local state
    try {
      api.logout();
    } catch (err) {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        phcId,
        hospitalId,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
