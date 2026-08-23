"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

export interface User {
  name: string;
  email: string;
  image?: string;
  provider?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, name?: string, image?: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync session & local user state
  useEffect(() => {
    try {
      if (session?.user) {
        const sessionUserData: User = {
          name: session.user.name || "Traveler",
          email: session.user.email || "",
          image: session.user.image || undefined,
          provider: session.user.provider || "oauth",
        };
        setLocalUser(sessionUserData);
        localStorage.setItem("voyageai_user", JSON.stringify(sessionUserData));
      } else {
        const savedUser = localStorage.getItem("voyageai_user");
        if (savedUser) {
          setLocalUser(JSON.parse(savedUser));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const login = (email: string, name?: string, image?: string) => {
    const defaultName = name || email.split("@")[0] || "Traveler";
    const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
    const userData: User = { email, name: formattedName, image };

    setLocalUser(userData);
    try {
      localStorage.setItem("voyageai_user", JSON.stringify(userData));
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    setLocalUser(null);
    try {
      localStorage.removeItem("voyageai_user");
    } catch (e) {
      console.error(e);
    }
    if (session) {
      nextAuthSignOut({ callbackUrl: "/" });
    }
  };

  const currentUser = session?.user
    ? {
        name: session.user.name || localUser?.name || "Traveler",
        email: session.user.email || localUser?.email || "",
        image: session.user.image || localUser?.image,
        provider: session.user.provider || "oauth",
      }
    : localUser;

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        isLoggedIn: !!currentUser,
        login,
        logout,
        isLoading: status === "loading" || isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
