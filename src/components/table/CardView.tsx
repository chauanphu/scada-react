import React from 'react';
import { Column } from './Table';

export type CardViewProps<T> = {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onCardClick?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
  actions?: (item: T) => React.ReactNode;
};

export function CardView<T>({
  data,
  columns,
  isLoading = false,
  onCardClick,
  keyExtractor,
  actions,
}: CardViewProps<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        Không có dữ liệu
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {data.map((item) => (
        <div
          key={keyExtractor(item)}
          className={`bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 ${
            onCardClick ? 'cursor-pointer' : ''
          }`}
          onClick={() => onCardClick && onCardClick(item)}
        >
          <div className="p-4">
            {columns.map((column, index) => {
              const isHeader = index === 0;
              const value = column.cell
                ? column.cell(item)
                : typeof column.accessor === 'function'
                  ? column.accessor(item)
                  : String(item[column.accessor] || '');

              return (
                <div
                  key={index}
                  className={`${
                    isHeader ? 'mb-3' : 'mb-2 flex flex-wrap justify-between items-center'
                  }`}
                >
                  {isHeader ? (
                    <h3 className="text-lg font-semibold text-blue-700">{value}</h3>
                  ) : (
                    <>
                      <span className="text-sm font-medium text-gray-500">{column.header}:</span>
                      <span className="text-sm text-gray-800">{value}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {actions && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end">
              {actions(item)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}