import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { CardHeader, CardContent } from "../components/ui/card";
import { Search } from 'lucide-react';
import { Cluster, Unit } from '../types/Cluster'; 
import { Input } from "../components/ui/input";
import { useWebSocket } from '../contexts/WebsocketProvider'; // Import the WebSocket hook
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Button } from "../components/ui/button"; // Assuming you have a button component

interface LeftSidebarProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  filteredClusters: Cluster[];
  setSelectedUnit: (unit: Unit) => void;
}

export const LeftSidebar = ({
  searchTerm, setSearchTerm,
  filteredClusters, setSelectedUnit,
}: LeftSidebarProps) => {
  const socketContext = useWebSocket();
  const unitStatus = socketContext?.unitStatuses || {};
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // const handleClusterSelect = (value: string) => {
  //   const clusterId = parseInt(value, 10);
  //   const selected = filteredClusters.find(cluster => cluster.id === clusterId) || null;
  // };

  const handleUnitSelect = (unit: Unit) => {
    const status = unitStatus[unit.id];
    if (!status) {
      setErrorMessage(`Thiết bị (${unit.name}) đã mất kết nối.`);
      setIsErrorDialogOpen(true);
      return;
    };
    const { gps_lat, gps_log } = status;
    if (!status || gps_lat === undefined || gps_log === undefined) {
      setErrorMessage(`Thiết bị ${unit.name} đã mất kết nối.`);
      setIsErrorDialogOpen(true);
      return;
    }

    setSelectedUnit({
      ...unit,
      latitude: gps_lat,
      longitude: gps_log,
    });
  };

  const getStatusColor = (isConnected: boolean, isOn: boolean): string => {
    if (!isConnected) return 'bg-gray-500'; 
    return isOn ? 'bg-green-500' : 'bg-red-500';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-14 border-b border-gray-200">
        <CardHeader>
          <h3 className="text-lg font-semibold mb-2">Danh sách Cụm</h3>
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative px-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 h-9 w-full bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-muted-foreground/60"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
          {/* <Select onValueChange={handleClusterSelect}> */}
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Chọn Cụm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={"0"}>Tất cả</SelectItem>
              {filteredClusters.map((cluster) => (
                <SelectItem key={cluster.id} value={cluster.id.toString()}>{cluster.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </div>

      <div className="flex-grow overflow-y-auto p-1">
        <CardContent>
          {filteredClusters.map(cluster => (
            <div key={cluster.id} className="mt-6 mb-6">
              <h3 className="text-md font-semibold">{cluster.name}</h3>
              <div className="pl-2">
                {cluster.units.map(unit => {
                  const status = unitStatus[unit.id] || { isOn: false, isConnected: false };
                  const statusColor = getStatusColor(status.isConnected, status.isOn);

                  return (
                    <div key={unit.id} className="flex items-center justify-between py-2">
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={() => handleUnitSelect(unit)}
                      >
                        <span className={`w-3 h-3 rounded-full mr-2 ${statusColor}`}></span>
                        <span>{unit.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <hr className="border-t border-gray-300 mt-4" />
            </div>
          ))}
        </CardContent>
      </div>

      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Báo Lỗi</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsErrorDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
