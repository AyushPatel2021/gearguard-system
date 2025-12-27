import { useState } from "react";
import { useEquipment } from "@/hooks/use-gear";
import { LayoutShell } from "@/components/layout-shell";
import { RequestDialog } from "@/components/request-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Filter, MonitorSmartphone } from "lucide-react";
import { useLocation } from "wouter";

export default function EquipmentPage() {
  const [, setLocation] = useLocation();
  const { data: equipment, isLoading } = useEquipment();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredEquipment = equipment?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === "all" ? true :
      filterStatus === "active" ? item.status === "active" :
        filterStatus === "scrapped" ? item.status === "scrapped" :
          true;

    return matchesSearch && matchesFilter;
  });

  return (
    <LayoutShell>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Equipment</h1>
          <p className="text-muted-foreground mt-1">Manage and track your machinery and assets.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setLocation("/equipment/new")}>
          <Plus className="h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={filterStatus === "all"} onCheckedChange={() => setFilterStatus("all")}>
                All Items
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filterStatus === "active"} onCheckedChange={() => setFilterStatus("active")}>
                Active Only
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={filterStatus === "scrapped"} onCheckedChange={() => setFilterStatus("scrapped")}>
                Scrapped Only
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading assets...</TableCell>
                </TableRow>
              ) : filteredEquipment?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No equipment found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipment?.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-slate-50/50 cursor-pointer"
                    onClick={() => setLocation(`/equipment/${item.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <MonitorSmartphone className="h-4 w-4" />
                        </div>
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {item.serialNumber}
                    </TableCell>
                    <TableCell>{item.location || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'active' ? 'default' : 'destructive'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <RequestDialog
                        preselectedEquipmentId={item.id}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary hover:bg-primary/5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Report Issue
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </LayoutShell>
  );
}
