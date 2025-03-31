import React, { useState, useEffect } from 'react';
import { FormField } from './CreateForm';

export type EditFormProps<T> = {
  title: string;
  fields: FormField<T>[];
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
};

export function EditForm<T>({
  title,
  fields,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Lưu',
}: EditFormProps<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (field: FormField<T>, value: any) => {
    setValues((prevValues) => ({
      ...prevValues,
      [field.name]: value,
    }));
    
    // Clear error when field is changed
    if (errors[field.name as string]) {
      setErrors((prevErrors) => {
        const updatedErrors = { ...prevErrors };
        delete updatedErrors[field.name as string];
        return updatedErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach((field) => {
      const value = values[field.name as keyof T];
      
      if (field.required && (value === undefined || value === null || value === '')) {
        newErrors[field.name as string] = `${field.label} là bắt buộc`;
      }
      
      
      // Number range validation
      if (field.type === 'number' && 
          field.min !== undefined && field.max !== undefined && 
          typeof value === 'number') {
        if (value < field.min || value > field.max) {
          newErrors[field.name as string] = `${field.label} phải từ ${field.min} đến ${field.max}`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Submit error:', error);
      // You could set a general form error here
    }
  };

  const renderField = (field: FormField<T>) => {
    const value = values[field.name as keyof T];
    const error = errors[field.name as string];
    const isDisabled = field.disabled === true || isSubmitting;
    // Special handling for password and email fields by checking name
    if (field.name === 'password') {
      return (
        <input
          type="password"
          id={`edit-${field.name as string}`}
          className={`w-full px-3 py-2 border rounded-md ${
            error ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          value={value as string || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={field.placeholder}
          disabled={isDisabled}
        />
      );
    }
    
    if (field.name === 'email') {
      return (
        <input
          type="email"
          id={`edit-${field.name as string}`}
          className={`w-full px-3 py-2 border rounded-md ${
            error ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          value={value as string || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={field.placeholder}
          disabled={isDisabled}
        />
      );
    }
    
    // Handle text-like input types
    if (field.type === 'text') {
      return (
        <input
          type="text"
          id={`edit-${field.name as string}`}
          className={`w-full px-3 py-2 border rounded-md ${
            error ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          value={value as string || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={field.placeholder}
          disabled={isDisabled}
        />
      );
    }
    
    // Handle other input types
    switch (field.type) {
      case 'number':
        return (
          <input
            type="number"
            id={`edit-${field.name as string}`}
            className={`w-full px-3 py-2 border rounded-md ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            value={value as number || 0}
            onChange={(e) => handleChange(field, parseInt(e.target.value) || 0)}
            placeholder={field.placeholder}
            disabled={isDisabled}
            min={field.min}
            max={field.max}
          />
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            id={`edit-${field.name as string}`}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            checked={value as boolean || false}
            onChange={(e) => handleChange(field, e.target.checked)}
            disabled={isDisabled}
          />
        );
      case 'select':
        return (
          <select
            id={`edit-${field.name as string}`}
            className={`w-full px-3 py-2 border rounded-md ${
              error ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            value={value as string || ''}
            onChange={(e) => handleChange(field, e.target.value)}
            disabled={isDisabled}
          >
            <option value="">-- Chọn --</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            {fields.map((field) => (
              <div key={field.name as string} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor={`edit-${field.name as string}`} 
                    className="block text-sm font-medium text-gray-700"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
                {renderField(field)}
                {errors[field.name as string] && (
                  <p className="text-red-500 text-xs mt-1">{errors[field.name as string]}</p>
                )}
              </div>
            ))}
          </div>
          
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-lg">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
