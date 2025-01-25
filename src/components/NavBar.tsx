import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAPI } from "../contexts/APIProvider";

interface Notification {
  id: string;
  message: string;
  timestamp: string;
}

export const Navbar: React.FC = () => {
  const location = useLocation();
  const apiContext = useAPI();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  if (!apiContext) {
    return null;
  }

  const { hasPermission } = apiContext;

  const tabs = [
    {
      name: "Trang chủ",
      href: "/",
      permission: "view",
    },
    {
      name: "Thiết bị",
      href: "/devices",
      permission: "view",
    },
    {
      name: "Người dùng",
      href: "/users",
      permission: "view",
    },
    {
      name: "Phân quyền",
      href: "/roles",
      permission: "view",
    },
    {
      name: "Nhật ký",
      href: "/audit",
      permission: "view",
    },
  ];

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img
                className="block lg:hidden h-8 w-auto"
                src="/logo.png"
                alt="Logo"
              />
              <img
                className="hidden lg:block h-8 w-auto"
                src="/logo.png"
                alt="Logo"
              />
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {tabs.map(
                (tab) =>
                  hasPermission(tab.permission) && (
                    <Link
                      key={tab.href}
                      to={tab.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                        location.pathname === tab.href
                          ? "border-indigo-500 text-gray-900"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      {tab.name}
                    </Link>
                  )
              )}
            </div>
          </div>
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="sr-only">Xem thông báo</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-700">
                        Không có thông báo mới
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <div className="font-medium">{notification.message}</div>
                          <div className="text-xs text-gray-500">
                            {notification.timestamp}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="ml-3">
              <button
                onClick={() => apiContext.logout()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-400 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};