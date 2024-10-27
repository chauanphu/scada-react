// pages/changelog.tsx

"use client";

import { useState, useEffect } from 'react';
import { getAuditLogs, AuditLog, PaginatedAuditLogs, downloadCSVAudit } from '../lib/api';
import Cookies from 'js-cookie';
import { useAPI } from '../contexts/APIProvider';
import { Navbar } from '../components/NavBar';

const ChangelogPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const apiContext = useAPI();
  const permissions = apiContext?.permissions || [];

  const token = Cookies.get('token') || '';
  // Trạng thái phân trang
  const [currentPage, setCurrentPage] = useState<number>(1);
  const entriesPerPage = 10; // Số mục cố định mỗi trang; có thể làm động nếu cần

  // Fetch Audit Logs whenever currentPage changes
  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!token) {
          throw new Error('Không tìm thấy mã thông báo xác thực.');
        }
        const data: PaginatedAuditLogs = await getAuditLogs(token, currentPage, entriesPerPage);
        setTotalPages(Math.ceil(data.total / entriesPerPage));
        setAuditLogs(data.items);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || 'Đã xảy ra lỗi không mong muốn.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [token, currentPage, entriesPerPage]);

  const handleDownloadCSV = async () => {
    try {
      await downloadCSVAudit(token);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  // Handler for page navigation
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Function to generate pagination range with ellipses
  const getPaginationRange = () => {
    const delta = 2; // Số trang hiển thị quanh trang hiện tại
    const range: (number | string)[] = [];
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    range.push(1);

    if (left > 2) {
      range.push('...');
    }

    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    if (right < totalPages - 1) {
      range.push('...');
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  return (
    <>
      <Navbar permissions={permissions} />

      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Nhật ký thay đổi</h1>

          {/* Trạng thái tải và lỗi */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
            </div>
          ) : error ? (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
              role="alert"
            >
              <strong className="font-bold">Lỗi:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={handleDownloadCSV}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Tải xuống CSV
                </button>
                {/* Tùy chọn: Bộ chọn số mục mỗi trang */}
                {/* <div>
                  <label htmlFor="entriesPerPage" className="mr-2 text-sm text-gray-700">
                    Số mục mỗi trang:
                  </label>
                  <select
                    id="entriesPerPage"
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setCurrentPage(1); // Đặt lại về trang đầu tiên
                    }}
                    className="px-2 py-1 border rounded"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div> */}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow rounded-lg">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Thời gian
                      </th>
                      <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Hành động
                      </th>
                      <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {log.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          Không có nhật ký kiểm toán nào có sẵn.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Thanh điều hướng phân trang */}
              <div className="flex justify-center mt-6">
                <nav className="inline-flex -space-x-px">
                  {/* Nút Trước */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 ml-0 leading-tight ${currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:bg-blue-100 hover:text-blue-700'
                      } bg-white border border-gray-300 rounded-l-lg`}
                  >
                    Trước
                  </button>

                  {/* Số trang với dấu "..." */}
                  {getPaginationRange().map((page, index) =>
                    page === '...' ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-3 py-2 text-gray-500"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(Number(page))}
                        className={`px-3 py-2 leading-tight border border-gray-300 ${page === currentPage
                            ? 'text-white bg-blue-600'
                            : 'text-blue-600 bg-white hover:bg-blue-100 hover:text-blue-700'
                          }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  {/* Nút Tiếp */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 leading-tight ${currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:bg-blue-100 hover:text-blue-700'
                      } bg-white border border-gray-300 rounded-r-lg`}
                  >
                    Tiếp
                  </button>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ChangelogPage;