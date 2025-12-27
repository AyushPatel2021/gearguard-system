import { useRequests, useUpdateRequest, useEquipmentDetail, useUsers } from "@/hooks/use-gear";
import { LayoutShell } from "@/components/layout-shell";
import { RequestDialog } from "@/components/request-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MoreHorizontal, ArrowLeft, Filter } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MaintenanceRequest } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useLocation, useSearch } from "wouter";

export default function RequestsPage() {
  const { data: requests, isLoading } = useRequests();
  const { data: users } = useUsers();
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const equipmentId = params.get("equipmentId") ? parseInt(params.get("equipmentId")!) : null;

  // Fetch equipment details if filtering by equipment
  const { data: equipment } = useEquipmentDetail(equipmentId || 0);

  if (isLoading) {
    return <LayoutShell><div>Loading...</div></LayoutShell>;
  }

  // Filter requests if equipmentId is present
  const filteredRequests = equipmentId
    ? requests?.filter(r => r.equipmentId === equipmentId)
    : requests;

  const columns = {
    new: filteredRequests?.filter(r => r.status === "new") || [],
    in_progress: filteredRequests?.filter(r => r.status === "in_progress") || [],
    repaired: filteredRequests?.filter(r => r.status === "repaired") || [],
    scrap: filteredRequests?.filter(r => r.status === "scrap") || [],
  };

  const priorityColor: Record<string, string> = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-red-100 text-red-700",
  };

  const statusColor: Record<string, string> = {
    new: "default",
    in_progress: "secondary",
    repaired: "outline",
    scrap: "destructive",
  };

  const getTechnicianNames = (ids?: number[]) => {
    if (!ids || ids.length === 0) return null;
    return ids.map(id => users?.find((u: any) => u.id === id)?.name).filter(Boolean);
  };

  return (
    <LayoutShell>
      <div className="flex flex-col gap-4">
        {equipmentId && equipment && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Button variant="ghost" size="sm" className="h-6 px-2 -ml-2 gap-1 text-muted-foreground hover:text-primary" onClick={() => setLocation(`/equipment/${equipmentId}`)}>
              <ArrowLeft className="h-3 w-3" />
              Back to {equipment.name}
            </Button>
            <span>/</span>
            <span className="font-medium text-slate-900">Maintenance Requests</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">
              {equipmentId ? `Requests for ${equipment?.name || "Equipment"}` : "Maintenance Requests"}
            </h1>
            <p className="text-muted-foreground mt-1">Track and manage repair tickets.</p>
          </div>
          <Button onClick={() => setLocation(equipmentId ? `/requests/new?equipmentId=${equipmentId}` : "/requests/new")}>
            New Request
          </Button>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="board">Kanban Board</TabsTrigger>
          </TabsList>

          <TabsContent value="board" className="mt-0">
            <div className="grid md:grid-cols-4 gap-6 h-[calc(100vh-250px)] overflow-hidden">
              <KanbanColumn title="New Requests" status="new" items={columns.new} color="bg-blue-50 border-blue-200" />
              <KanbanColumn title="In Progress" status="in_progress" items={columns.in_progress} color="bg-amber-50 border-amber-200" />
              <KanbanColumn title="Completed" status="repaired" items={columns.repaired} color="bg-green-50 border-green-200" />
              <KanbanColumn title="Scrap" status="scrap" items={columns.scrap} color="bg-red-50 border-red-200" />
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Technicians</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Date Created</TableHead>
                      {!equipmentId && <TableHead>Equipment ID</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No maintenance requests found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRequests?.map((request: any) => (
                        <TableRow
                          key={request.id}
                          className="hover:bg-slate-50/50 cursor-pointer"
                          onClick={() => setLocation(`/requests/${request.id}`)}
                        >
                          <TableCell className="font-medium">{request.subject}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {getTechnicianNames(request.technicianIds)?.map((name, i) => (
                                <Badge key={i} variant="outline" className="text-xs font-normal">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColor[request.status] as any} className="capitalize">
                              {request.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("capitalize shadow-none", priorityColor[request.priority])}>
                              {request.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(request.createdAt), "MMM d, yyyy")}
                          </TableCell>
                          {!equipmentId && <TableCell>{request.equipmentId}</TableCell>}
                          <TableCell className="text-right">
                            {/* Prevent row click propagation for actions menu if needed, though menu usually handles it */}
                            <div onClick={e => e.stopPropagation()}>
                              <RequestActions request={request} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutShell>
  );
}

function KanbanColumn({ title, status, items, color }: { title: string, status: string, items: MaintenanceRequest[], color: string }) {
  return (
    <div className={cn("flex flex-col h-full rounded-2xl border bg-gray-50/50", color)}>
      <div className="p-4 border-b border-gray-200/50 flex justify-between items-center bg-white/50 backdrop-blur-sm rounded-t-2xl">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <Badge variant="secondary" className="bg-white">{items.length}</Badge>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
        {items.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
}

function RequestActions({ request }: { request: MaintenanceRequest }) {
  const updateRequest = useUpdateRequest();
  const [_, setLocation] = useLocation();

  const handleStatusChange = (e: React.MouseEvent, newStatus: "new" | "in_progress" | "repaired" | "scrap") => {
    e.stopPropagation(); // Critical to prevent row click
    updateRequest.mutate({
      id: request.id,
      data: { status: newStatus }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/requests/${request.id}`); }}>
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleStatusChange(e, "new")}>Move to New</DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleStatusChange(e, "in_progress")}>Move to In Progress</DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleStatusChange(e, "repaired")}>Mark Completed</DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleStatusChange(e, "scrap")}>Mark Scrapped</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RequestCard({ request }: { request: MaintenanceRequest }) {
  const updateRequest = useUpdateRequest();
  const [_, setLocation] = useLocation();

  const handleStatusChange = (e: React.MouseEvent, newStatus: "new" | "in_progress" | "repaired" | "scrap") => {
    e.stopPropagation();
    updateRequest.mutate({
      id: request.id,
      data: { status: newStatus }
    });
  };

  const priorityColor: Record<string, string> = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <Card
      className="shadow-sm border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setLocation(`/requests/${request.id}`)}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <Badge className={cn("capitalize shadow-none", priorityColor[request.priority])}>
            {request.priority}
          </Badge>
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/requests/${request.id}`); }}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleStatusChange(e, "new")}>Move to New</DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleStatusChange(e, "in_progress")}>Move to In Progress</DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleStatusChange(e, "repaired")}>Mark Completed</DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleStatusChange(e, "scrap")}>Mark Scrapped</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardTitle className="text-base font-semibold mt-2 line-clamp-1">
          {request.subject}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {request.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          {format(new Date(request.createdAt), "MMM d, yyyy")}
        </div>
      </CardContent>
    </Card>
  );
}

