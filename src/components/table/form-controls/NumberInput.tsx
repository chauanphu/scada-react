import React from 'react';

interface NumberInputProps {
  value: number | string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  placeholder,
  className = '',
}) => {
  return (
    <input
      type="number"
      value={value === undefined || value === null ? '' : value}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      min={min}
      max={max}
      placeholder={placeholder}
      className={`w-full p-1 border rounded ${className}`}
      onClick={(e) => e.stopPropagation()}
    />
  );
};
