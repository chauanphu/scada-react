import { User, BarChart , FileText , LogOut, Home, Server } from 'lucide-react'
import { Button } from "../components/ui/button"
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie'
import logo from '../images/logo/logo.png'

export enum PermissionEnum {
    MONITOR_SYSTEM = 'GIÁM SÁT HỆ THỐNG',
    CONTROL_DEVICE = 'ĐIỀU KHIỂN THIẾT BỊ',
    REPORT = 'BÁO CÁO',
    MANAGE_USER = 'QUẢN LÝ USER',
    CONFIG_DEVICE = 'CẤU HÌNH THIẾT BỊ',
    VIEW_CHANGE_LOG = 'XEM NHẬT KÝ THAY ĐỔI'
}

export function Navbar({ permissions }: { permissions: PermissionEnum[] }) {
    const navigate = useNavigate();
    const handleLogout = () => {
        Cookies.remove("token");
        navigate('/login');
    };

    // Define tabs with their name, URL, and accessibility based on roles
    const tabs = [
        {
            name: 'Trang chủ',
            url: '/',
            icon: <Home className="h-5 w-5" />,
            isAccessible: true,
        },
        {
            name: 'Người dùng',
            url: '/user',
            icon: <User className="h-5 w-5" />,
            isAccessible: permissions.includes(PermissionEnum.MANAGE_USER) || permissions.includes(PermissionEnum.MONITOR_SYSTEM),
        },
        {
            name: 'Thiết bị',
            url: '/cluster',
            icon: <Server className="h-5 w-5" />,
            isAccessible: permissions.includes(
                PermissionEnum.MONITOR_SYSTEM || PermissionEnum.CONTROL_DEVICE || PermissionEnum.CONFIG_DEVICE,
            ),
        },
        {
            name: 'Báo cáo',
            url: '/report',
            icon: <BarChart className="h-5 w-5" />,
            isAccessible: permissions.includes(PermissionEnum.REPORT),
        },
        {
            name: 'Nhật ký thay đổi',
            url: '/changelog',
            icon: <FileText  className="h-5 w-5" />,
            isAccessible: permissions.includes(PermissionEnum.VIEW_CHANGE_LOG),
        }
    ];

    return (
        <div className="fixed bg-white left-0 right-0 z-50 flex items-center w-full h-14 px-6">
            {/* Left side with logo and tabs */}
            <div className="flex items-center space-x-2">
                {/* Logo on the left */}
                <div className="flex-none w-16">
                    <img src={logo} alt="Logo" width={40} height={40} className="rounded-full shadow-md" />
                </div>

                {/* Tabs aligned on the left */}
                {tabs.map((tab, index) => (
                    tab.isAccessible && (
                        <Button
                            key={index}
                            variant="ghost"
                            className="rounded-full flex items-center space-x-2"
                            onClick={() => navigate(tab.url)}
                        >
                            {tab.icon}
                            <span>{tab.name}</span>
                        </Button>
                    )
                ))}
            </div>

            {/* Spacer to push the logout button to the right */}
            <div className="flex-grow"></div>

            {/* Logout button on the right */}
            <div className="flex items-center">
                <Button
                    variant="ghost"
                    className="rounded-full flex items-center space-x-2 text-red-700 hover:text-red-900"
                    onClick={handleLogout}
                >
                    <LogOut className="h-5 w-5" />
                    <span>Đăng xuất</span>
                </Button>
            </div>
        </div>
    );
}
