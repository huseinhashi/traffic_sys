// src/components/shared/Form.jsx
import React from 'react';
import { useFormValidation, handleRequestError } from '@/utils/errorHandling';
import { FormError } from './ErrorComponents';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

export const Form = ({ 
  onSubmit, 
  children, 
  submitText = "Submit", 
  className = "",
  isLoading = false
}) => {
  const { toast } = useToast();
  const { 
    validationErrors, 
    setErrors, 
    clearErrors, 
    hasErrors 
  } = useFormValidation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    
    try {
      await onSubmit(e);
    } catch (error) {
      handleRequestError(error, setErrors, toast);
    }
  };

  // Provide validation context to all children components
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { 
        errors: validationErrors,
      });
    }
    return child;
  });

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      {validationErrors.general && (
        <FormError error={validationErrors.general} />
      )}
      
      {childrenWithProps}
      
      <Button 
        type="submit" 
        className="mt-4 w-full" 
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : submitText}
      </Button>
    </form>
  );
};