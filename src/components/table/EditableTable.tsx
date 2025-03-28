import React, { useState } from 'react';
import { Table, Column, TableProps } from './Table';
import { TextInput, NumberInput, DropdownInput, CheckboxInput, DropdownOption } from './form-controls';

export type ColumnType = 'text' | 'number' | 'dropdown' | 'checkbox' | 'custom';

export type EditableColumn<T, K extends object = {}> = Column<T> & {
  editable?: boolean;
  type?: ColumnType;
  options?: DropdownOption[];  // For dropdown columns
  min?: number;  // For number columns
  max?: number;  // For number columns
  editComponent?: (
    value: any,
    onChange: (value: any) => void,
    item: T
  ) => React.ReactNode;
};

export type EditableTableProps<T, K extends object = {}> = Omit<TableProps<T>, 'columns' | 'actions'> & {
  columns: EditableColumn<T, K>[];
  editableRows?: boolean;
  onEdit: (id: string | number, data: Partial<K>) => Promise<void>;
  onDelete?: (id: string | number) => Promise<void>;
  idField: keyof T;
};

export function EditableTable<T extends object, K extends object = Partial<T>>({
  data,
  columns,
  editableRows = true,
  onEdit,
  onDelete,
  idField,
  ...tableProps
}: EditableTableProps<T, K>) {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editData, setEditData] = useState<Partial<K>>({} as Partial<K>);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (item: T) => {
    const id = item[idField] as string | number;
    setEditingId(id);
    
    // Initialize edit data with current values
    const initialData = {} as Partial<K>;
    columns.forEach(column => {
      if (typeof column.accessor === 'string') {
        // @ts-ignore - We know this is safe because we're checking accessor is a string
        initialData[column.accessor as keyof K] = item[column.accessor];
      }
    });
    
    setEditData(initialData);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({} as Partial<K>);
  };

  const handleSubmitEdit = async (id: string | number) => {
    setIsSubmitting(true);
    try {
      await onEdit(id, editData);
      setEditingId(null);
      setEditData({} as Partial<K>);
    } catch (error) {
      console.error('Failed to update:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!onDelete) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa mục này không?')) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const renderActions = (item: T) => {
    const id = item[idField] as string | number;
    const isEditing = editingId === id;

    return (
      <div className="flex items-center space-x-2">
        {isEditing ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSubmitEdit(id);
              }}
              disabled={isSubmitting}
              className="text-green-600 hover:text-green-800"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Lưu"
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelEdit();
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              Hủy
            </button>
          </>
        ) : (
          <>
            {editableRows && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit(item);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Sửa
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(id);
                }}
                className="text-red-600 hover:text-red-800"
              >
                Xóa
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  // Render the appropriate edit component based on column type
  const renderEditComponent = (column: EditableColumn<T, K>, item: T, value: any) => {
    const accessorKey = column.accessor as string;
    const currentValue = editData[accessorKey as keyof K] !== undefined 
      ? editData[accessorKey as keyof K] 
      : item[accessorKey as keyof T];
    
    // Use custom edit component if provided
    if (column.editComponent) {
      return column.editComponent(
        currentValue,
        (newValue) => setEditData({ ...editData, [accessorKey]: newValue }),
        item
      );
    }

    // Use the appropriate input component based on column type
    switch (column.type) {
      case 'number':
        return (
          <NumberInput
            value={currentValue as number}
            onChange={(newValue) => setEditData({ ...editData, [accessorKey]: newValue })}
            min={column.min}
            max={column.max}
          />
        );
      
      case 'dropdown':
        return (
          <DropdownInput
            value={currentValue as string | number}
            onChange={(newValue) => setEditData({ ...editData, [accessorKey]: newValue })}
            options={column.options || []}
            placeholder={`-- Chọn ${column.header.toLowerCase()} --`}
          />
        );
        
      case 'checkbox':
        return (
          <CheckboxInput
            checked={Boolean(currentValue)}
            onChange={(checked) => setEditData({ ...editData, [accessorKey]: checked })}
          />
        );
        
      case 'text':
      default:
        return (
          <TextInput
            value={String(currentValue || '')}
            onChange={(newValue) => setEditData({ ...editData, [accessorKey]: newValue })}
          />
        );
    }
  };

  // Modify columns for editing
  const processedColumns: Column<T>[] = columns.map(column => {
    if (!column.editable) return column;

    return {
      ...column,
      cell: (item: T) => {
        const id = item[idField] as string | number;
        const isEditing = editingId === id;

        if (isEditing) {
          return renderEditComponent(column, item, null);
        }

        return column.cell 
          ? column.cell(item) 
          : typeof column.accessor === 'function'
            ? column.accessor(item)
            : String(item[column.accessor] || '');
      }
    };
  });

  return (
    <Table<T>
      {...tableProps}
      data={data}
      columns={processedColumns}
      actions={renderActions}
      onRowClick={(item) => {
        if (tableProps.onRowClick) {
          tableProps.onRowClick(item);
        }
      }}
    />
  );
}