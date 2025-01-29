import { useEffect, useState } from "react";
import { useAPI } from "../contexts/APIProvider";
import { getAuditLogs, downloadCSVAudit, AuditLog } from "../lib/api";

export const AuditPage = (): JSX.Element => {
  const apiContext = useAPI();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchLogs = async () => {
    if (!apiContext?.token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      const data = await getAuditLogs(apiContext.token, page);
      setLogs(data.items || []);
      setTotalPages(Math.ceil(data.total / data.page_size));
      setError(null);
    } catch (err) {
      console.log(err);

      setError("Failed to fetch audit logs" + err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!apiContext?.token) {
      setError("Not authenticated");
      return;
    }

    try {
      await downloadCSVAudit(apiContext.token);
    } catch (err) {
       console.log(err);
      setError("Failed to download CSV" + err);
    }
  };

  useEffect(() => {
    if (!apiContext?.token) {
      return;
    }
    void fetchLogs();
  }, [page, apiContext?.token, fetchLogs]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!apiContext?.token) {
    return <div className="p-4">Please log in to view audit logs.</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              onClick={handleDownloadCSV}
            >
              Download CSV
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="bg-white shadow overflow-x-auto rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Timestamp
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Action
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Resource
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs && logs.length > 0 ? (
                      logs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.action}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.target}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {log.details}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No audit logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};