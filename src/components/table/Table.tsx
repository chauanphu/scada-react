import React, { useState, useMemo } from 'react';

export type Column<T> = {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortable?: boolean;
  cell?: (item: T) => React.ReactNode;
};

type SortDirection = 'asc' | 'desc' | null;

export type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  itemsPerPage?: number;
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
  actions?: (item: T) => React.ReactNode;
};

export function Table<T>({
  data,
  columns,
  itemsPerPage = 10,
  isLoading = false,
  onRowClick,
  keyExtractor,
  actions,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: SortDirection;
  }>({
    key: null,
    direction: null,
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Handle sorting
  const handleSort = (key: keyof T) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }

    setSortConfig({ key, direction });
  };

  // Handle pagination
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filteredData = [...data];

    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter((item) => {
        return columns.some((column) => {
          if (typeof column.accessor === 'function') {
            return false;
          }
          const value = String(item[column.accessor as keyof T] || '').toLowerCase();
          return value.includes(searchTerm.toLowerCase());
        });
      });
    }

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      filteredData.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof T];
        const bValue = b[sortConfig.key as keyof T];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [data, searchTerm, sortConfig, columns]);

  // Get current page data
  const currentData = filteredAndSortedData.slice(startIndex, endIndex);

  return (
    <div className="w-full">
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset page when searching
          }}
          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                  onClick={() => {
                    if (column.sortable && typeof column.accessor !== 'function') {
                      handleSort(column.accessor as keyof T);
                    }
                  }}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && typeof column.accessor !== 'function' && (
                      <span className="ml-1">
                        {sortConfig.key === column.accessor
                          ? sortConfig.direction === 'asc'
                            ? '↑'
                            : sortConfig.direction === 'desc'
                              ? '↓'
                              : '○'
                          : '○'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Hành động</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              currentData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {columns.map((column, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-4">
                      {column.cell
                        ? column.cell(item)
                        : typeof column.accessor === 'function'
                          ? column.accessor(item)
                          : String(item[column.accessor] || '')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-4">
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 px-2">
          <div className="text-sm text-gray-600">
            Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} trong số{' '}
            {filteredAndSortedData.length} mục
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              &lt;
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              const pages = [];
              const start = Math.max(1, currentPage - 2);
              const end = Math.min(totalPages, start + 4);
              
              for (let j = start; j <= end; j++) {
                pages.push(
                  <button
                    key={j}
                    onClick={() => setCurrentPage(j)}
                    className={`px-3 py-1 rounded ${
                      currentPage === j ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                    }`}
                  >
                    {j}
                  </button>
                );
              }
              return pages;
            })}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}