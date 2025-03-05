import { useEffect, useState, useCallback } from "react";
import { useAPI } from "../contexts/APIProvider";
import { getAlerts, Alert } from "../lib/api";

export const AlertPage = (): JSX.Element => {
    const apiContext = useAPI();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch alerts with useCallback to prevent infinite re-renders
    const fetchAlerts = useCallback(async () => {
        if (!apiContext?.token) {
            setError("Not authenticated");
            setLoading(false);
            return;
        }

        try {
            const data = await getAlerts(apiContext.token, page);
            setAlerts(data.items || []);
            setTotalPages(Math.ceil(data.total / data.page_size));
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch alerts: " + err);
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    }, [apiContext?.token, page]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    if (!apiContext?.token) {
        return <div className="p-4">Vui lòng đăng nhập</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Cảnh báo</h1>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Thời gian
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Thiết bị
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                TÌnh trạng
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Mức độ
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Được giải quyết vào lúc
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Bởi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {alerts.length > 0 ? (
                                            alerts.map((alert) => (
                                                <tr key={alert._id}>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(alert.timestamp)}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {alert.device_name}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {alert.state}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {alert.severity}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-500">
                                                        {alert.resolved_time || "-"}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-500">
                                                        {alert.resolve_by || "-"}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                    Không tìm thấy cảnh báo
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="mt-4 flex justify-center">
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                >
                                    Lùi về trước
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                >
                                    Tiếp theo
                                </button>
                            </nav>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
