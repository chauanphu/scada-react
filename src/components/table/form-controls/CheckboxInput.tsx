import React from 'react';

interface CheckboxInputProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const CheckboxInput: React.FC<CheckboxInputProps> = ({
  checked,
  onChange,
  label,
  className = '',
}) => {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`rounded text-blue-600 focus:ring-blue-500 ${className}`}
        onClick={(e) => e.stopPropagation()}
      />
      {label && <span className="ml-2 text-sm">{label}</span>}
    </div>
  );
};
