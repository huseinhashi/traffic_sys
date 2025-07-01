// src/utils/errorHandling.js

export const parseBackendErrors = (error) => {
  // No response or network error
  if (!error.response) {
    return {
      general: error.message || "Network error - please check your connection",
    };
  }

  const errorData = error.response?.data;
  if (!errorData) {
    return { general: `Server error (${error.response.status})` };
  }

  if (errorData?.errors && typeof errorData.errors === "object") {
    const errors = { ...errorData.errors };
    if (errorData.error && !errors.general) {
      errors.general = errorData.error;
    }
    return errors;
  }

  // Handle Sequelize errors - both validation and unique constraint
  if (
    (errorData?.error === "Validation error" ||
      errorData?.error === "Duplicate record") &&
    errorData?.errors
  ) {
    return errorData.errors;
  }

  // Handle array of errors
  if (Array.isArray(errorData?.errors)) {
    const formattedErrors = {};
    errorData.errors.forEach((err) => {
      if (err.path) {
        formattedErrors[err.path] = err.message;
      } else if (err.field) {
        formattedErrors[err.field] = err.message;
      }
    });

    if (Object.keys(formattedErrors).length > 0) {
      return formattedErrors;
    }
  }

  // Generic error message
  return {
    general:
      errorData?.error ||
      errorData?.message ||
      `Server error (${error.response.status})`,
  };
};

export const clearFieldError = (currentErrors, fieldName) => {
  const newErrors = { ...currentErrors };
  delete newErrors[fieldName];
  return newErrors;
};

import { useState } from "react";

export const useFormValidation = () => {
  const [validationErrors, setValidationErrors] = useState({});

  const clearErrors = () => setValidationErrors({});

  const clearFieldError = (fieldName) => {
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const setErrors = (errors) => setValidationErrors(errors);

  const hasErrors = Object.keys(validationErrors).length > 0;

  return {
    validationErrors,
    setErrors,
    clearErrors,
    clearFieldError,
    hasErrors,
  };
};

export const hasFieldError = (validationErrors, fieldName) => {
  return Boolean(validationErrors[fieldName]);
};

export const handleRequestError = (error, setValidationErrors, toast) => {
  const errors = parseBackendErrors(error);
  setValidationErrors(errors);
  if (errors.general) {
    toast({
      variant: "destructive",
      title: "Error",
      description: errors.general,
    });
  }

  return errors;
};
