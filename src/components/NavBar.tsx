import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAPI } from "../contexts/APIProvider";
import { HiHome, HiUserGroup, HiDesktopComputer, HiUser, HiClipboardList, HiBell, HiDownload } from "react-icons/hi";


export const Navbar = () => {
  const location = useLocation();
  const apiContext = useAPI();

  // Removed obsolete notifications state
  // const [notifications] = useState<Notification[]>([]);
  // const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!apiContext) {
    return null;
  }

  const { hasPermission } = apiContext;
  const tabs = [
    { name: "Bảng điều khiển", href: "/", permission: "/" },
    { name: "Khách hàng", href: "/tenants", permission: "/tenants" },
    { name: "Thiết bị", href: "/devices", permission: "/devices" },
    { name: "Người dùng", href: "/users", permission: "/users" },
    // { name: "Phân quyền", href: "/roles", permission: "/roles" },
    { name: "Nhật ký", href: "/audit", permission: "/audit" },
    { name: "Cảnh báo", href: "/alerts", permission: "/alerts" },
    { name: "Cập nhật phần mềm", href: "/firmware", permission: "/firmware" }
  ];

  // Helper to return an icon for each tab based on its permission/href
  const getTabIcon = (perm: string) => {
    switch (perm) {
      case "/":
        return <HiHome className="h-5 w-5" />;
      case "/tenants":
        return <HiUserGroup className="h-5 w-5" />;
      case "/devices":
        return <HiDesktopComputer className="h-5 w-5" />;
      case "/users":
        return <HiUser className="h-5 w-5" />;
      case "/audit":
        return <HiClipboardList className="h-5 w-5" />;
      case "/alerts":
        return <HiBell className="h-5 w-5" />;
      case "/firmware":
        return <HiDownload className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const logoutIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
    </svg>
  );

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img className="h-8 w-auto" src="/logo.png" alt="Logo" />
            </div>
            {/* Desktop menu */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
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
                      <div className="flex items-center space-x-1">
                        {getTabIcon(tab.permission)}
                        <span>{tab.name}</span>
                      </div>
                    </Link>
                  )
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded="false"
            >
              <span className="sr-only">Mở menu</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>

          {/* Desktop logout */}
          <div className="hidden md:flex items-center">
            <div className="ml-3">
              <button
                onClick={() => apiContext.logout()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-400 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <div className="flex items-center space-x-1">
                  {logoutIcon}
                  <span>Đăng xuất</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu panel */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {tabs.map(
                (tab) =>
                  hasPermission(tab.permission) && (
                    <Link
                      key={tab.href}
                      to={tab.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                        location.pathname === tab.href
                          ? "border-indigo-500 text-indigo-700 bg-indigo-50"
                          : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      <div className="flex items-center space-x-1">
                        {getTabIcon(tab.permission)}
                        <span>{tab.name}</span>
                      </div>
                    </Link>
                  )
              )}
              <div className="mt-3 px-3 pt-4 pb-3 border-t border-gray-200">
                <button
                  onClick={() => apiContext.logout()}
                  className="w-full flex items-center justify-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-400 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <div className="flex items-center space-x-1">
                    {logoutIcon}
                    <span>Đăng xuất</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};