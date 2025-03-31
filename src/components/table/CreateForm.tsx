import React, { useState } from 'react';

export type FormField<T> = {
  name: keyof T;
  label: string;
  type: 'text' | 'checkbox' | 'select' | 'date' | 'textarea' | 'custom' | 'number';
  required?: boolean;
  options?: { value: string | number; label: string }[]; // For select fields
  renderCustom?: (
    value: any,
    onChange: (value: any) => void,
    formValues: Partial<T>
  ) => React.ReactNode; // For custom components
  placeholder?: string;
  min?: number; // For number input
  max?: number; // For number input
  visible?: boolean; // For conditional rendering
};

export type CreateFormProps<T> = {
  fields: FormField<T>[];
  initialValues: Partial<T>;
  onSubmit: (values: T) => Promise<void>;
  onCancel?: () => void;
  title?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
};

export function CreateForm<T>({
  fields,
  initialValues,
  onSubmit,
  onCancel,
  title = 'Tạo mới',
  submitLabel = 'Tạo',
  isSubmitting = false,
}: CreateFormProps<T>) {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const handleChange = (name: keyof T, value: any) => {
    setValues({ ...values, [name]: value });
    setTouched({ ...touched, [name as string]: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = fields.reduce((acc, field) => {
      acc[field.name as string] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);
    
    // Validate required fields
    const isValid = fields
    .filter((field) => field.visible !== false)
    .every((field) => {
      return !field.required || (values[field.name] !== undefined && values[field.name] !== '');
    });
    
    if (isValid) {
      await onSubmit(values as T);
    }
  };

  const isFieldInvalid = (name: keyof T, required?: boolean) => {
    return touched[name as string] && required && (values[name] === undefined || values[name] === '');
  };

  return (
    <div className="bg-white shadow-lg rounded-xl mb-6 p-4 md:p-6">
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields
        .filter((field) => field.visible !== false)
        .map((field) => (
          <div key={field.name as string}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            
            {field.type === 'text' && (
              <input
                type="text"
                value={values[field.name] as string || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isFieldInvalid(field.name, field.required) ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}
            
            {field.type === 'number' && (
              <input
                type="number"
                value={values[field.name] === undefined ? '' : (values[field.name] as string | number)}
                onChange={(e) => handleChange(field.name, e.target.value === '' ? '' : Number(e.target.value))}
                placeholder={field.placeholder}
                min={field.min !== undefined ? field.min : undefined}
                max={field.max !== undefined ? field.max : undefined}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isFieldInvalid(field.name, field.required) ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}
            
            {field.type === 'textarea' && (
              <textarea
                value={values[field.name] as string || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isFieldInvalid(field.name, field.required) ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={4}
              />
            )}
            
            {field.type === 'checkbox' && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Boolean(values[field.name])}
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{field.placeholder || field.label}</span>
              </div>
            )}
            
            {field.type === 'select' && field.options && (
              <select
                value={values[field.name] as string || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isFieldInvalid(field.name, field.required) ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Chọn {field.label.toLowerCase()} --</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            
            {field.type === 'date' && (
              <input
                type="date"
                value={values[field.name] as string || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  isFieldInvalid(field.name, field.required) ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}
            
            {field.type === 'custom' && field.renderCustom && (
              field.renderCustom(
                values[field.name],
                (value) => handleChange(field.name, value),
                values
              )
            )}
            
            {isFieldInvalid(field.name, field.required) && (
              <p className="mt-1 text-sm text-red-500">Trường này là bắt buộc</p>
            )}
          </div>
        ))}
        
        <div className="mt-6 flex flex-col-reverse md:flex-row gap-3 md:justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Hủy bỏ
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </div>
  );
}