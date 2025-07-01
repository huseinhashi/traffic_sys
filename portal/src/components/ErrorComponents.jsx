// src/components/shared/ErrorComponents.jsx

import React from 'react';
import { hasFieldError } from '@/utils/errorHandling';

export const ValidationError = ({ message }) => {
  if (!message) return null;
  
  return (
    <p className="text-sm text-destructive mt-1">{message}</p>
  );
};
export const FormError = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="bg-destructive/15 p-3 rounded-md mb-4 text-destructive text-sm">
      {error}
    </div>
  );
};
export const withErrorStyles = (Component) => {
  return ({ errors, name, className, ...props }) => {
    const hasError = hasFieldError(errors, name);
    const errorClass = hasError ? 'border-destructive' : '';
    
    return (
      <>
        <Component 
          className={`${className || ''} ${errorClass}`} 
          {...props} 
        />
        <ValidationError message={errors[name]} />
      </>
    );
  };
};

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const ErrorInput = withErrorStyles(Input);
export const ErrorSelectTrigger = withErrorStyles(SelectTrigger);
export const ErrorTextarea = withErrorStyles(Textarea);