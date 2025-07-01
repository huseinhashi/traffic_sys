// src/hooks/useApiRequest.js
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { parseBackendErrors } from "@/utils/errorHandling";
import axios from "@/lib/api_calls";

export const useApiRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const request = async (config, options = {}) => {
    const {
      onSuccess,
      onError,
      successMessage,
      showErrorToast = true,
    } = options;

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios(config);

      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }

      if (onSuccess) {
        onSuccess(response.data);
      }

      return response.data;
    } catch (err) {
      const parsedErrors = parseBackendErrors(err);
      setError(parsedErrors);

      if (showErrorToast && parsedErrors.general) {
        toast({
          variant: "destructive",
          title: "Error",
          description: parsedErrors.general,
        });
      }

      if (onError) {
        onError(parsedErrors);
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    request,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};
