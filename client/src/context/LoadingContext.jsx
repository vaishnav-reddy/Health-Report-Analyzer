import React, { createContext, useState, useContext } from "react";
import LoadingSpinner from "../components/LoadingSpinner";

// Create the context
const LoadingContext = createContext();

// Provider component
export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      {isLoading && <LoadingSpinner />}
    </LoadingContext.Provider>
  );
};

// Custom hook for consuming the context
export const useLoading = () => {
  return useContext(LoadingContext);
};

