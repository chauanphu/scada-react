import React from 'react';

export interface DropdownOption {
  value: string | number;
  label: string;
}

interface DropdownInputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
}

export const DropdownInput: React.FC<DropdownInputProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = '',
}) => {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-1 border rounded ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
