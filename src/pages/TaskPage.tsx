// pages/TaskPage.tsx

"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Task, TaskType, TaskStatus } from "../types/Task";
import { getTasks, updateTask, Assignee, getAssignees } from "../lib/api";
import { Navbar } from "../components/NavBar";
import { useAPI } from "../contexts/APIProvider";

const TaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const entriesPerPage = 10;
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assignees, setAssignees] = useState<Assignee[]>([]); // For dropdown of assignees

  const token = Cookies.get("token") || "";
  const apiContext = useAPI();
  const permissions = apiContext?.permissions || [];
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!token) {
          throw new Error("Không tìm thấy mã thông báo xác thực.");
        }
        const data = await getTasks(
          token,
          currentPage,
          entriesPerPage,
          typeFilter,
          statusFilter
        );
        setTotalPages(Math.ceil(data.total / entriesPerPage));
        setTasks(data.items);
      } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi không mong muốn.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [token, currentPage, entriesPerPage, typeFilter, statusFilter]);

  useEffect(() => {
    // Fetch list of possible assignees (e.g., users)
    const fetchAssignees = async () => {
      try {
        // Replace with actual API call to get users
        const users = await getAssignees(token);
        setAssignees(users.map((user) => ({ id: user.id, email: user.email })));
      } catch (error) {
        console.error("Error fetching assignees:", error);
      }
    };

    fetchAssignees();
  }, [token]);

  const handleAssigneeChange = async (taskId: string, assignee: string) => {
    try {
      await updateTask(token, taskId, { assignedTo: assignee });
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, assignedTo: assignee } : task
        )
      );
    } catch (error) {
      console.error("Error updating assignee:", error);
    }
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTask(token, taskId, { status });
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status } : task
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getPaginationRange = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    range.push(1);

    if (left > 2) {
      range.push("...");
    }

    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    if (right < totalPages - 1) {
      range.push("...");
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Danh sách công việc</h1>

          {/* Filters */}
          <div className="flex space-x-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sự cố
              </label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Tất cả</option>
                {Object.values(TaskType).map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Tất cả</option>
                {Object.values(TaskStatus).map((status, index) => (
                  <option key={index} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading and Error Handling */}
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
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white shadow rounded-lg">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Thời gian
                      </th>
                      <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Thiết bị
                      </th>
                      <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Sự cố
                      </th>
                      <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700">
                        Người phụ trách
                      </th>
                      {/* Remove the last column header */}
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {new Date(task.time).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {task.device}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          {task.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(
                                task.id,
                                e.target.value as TaskStatus
                              )
                            }
                            className={`border-gray-300 rounded-md ${
                              task.status === TaskStatus.COMPLETED
                                ? "text-green-600"
                                : task.status === TaskStatus.IN_PROGRESS
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {Object.values(TaskStatus).map((status) => (
                              <option
                                key={status}
                                value={status}
                                className={`${
                                  status === TaskStatus.COMPLETED
                                    ? "text-green-600"
                                    : status === TaskStatus.IN_PROGRESS
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                              >
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                          <select
                            value={task.assignedTo || ""}
                            onChange={(e) =>
                              handleAssigneeChange(task.id, e.target.value)
                            }
                            className="border-gray-300 rounded-md"
                          >
                            <option value="">Chọn người phụ trách</option>
                            {assignees.map((assignee) => (
                              <option key={assignee.id} value={assignee.id}>
                                {assignee.email}
                              </option>
                            ))}
                          </select>
                        </td>
                        {/* Remove the last column data */}
                      </tr>
                    ))}
                    {tasks.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          Không có công việc nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-center mt-6">
                <nav className="inline-flex -space-x-px">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 ml-0 leading-tight ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                    } bg-white border border-gray-300 rounded-l-lg`}
                  >
                    Trước
                  </button>

                  {getPaginationRange().map((page, index) =>
                    page === "..." ? (
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
                        className={`px-3 py-2 leading-tight border border-gray-300 ${
                          page === currentPage
                            ? "text-white bg-blue-600"
                            : "text-blue-600 bg-white hover:bg-blue-100 hover:text-blue-700"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 leading-tight ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:bg-blue-100 hover:text-blue-700"
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

export default TaskPage;
