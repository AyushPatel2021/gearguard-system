import { useRequests, useUpdateRequest } from "@/hooks/use-gear";
import { LayoutShell } from "@/components/layout-shell";
import { RequestDialog } from "@/components/request-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, AlertCircle, CheckCircle, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MaintenanceRequest } from "@shared/schema";
import { cn } from "@/lib/utils";

export default function RequestsPage() {
  const { data: requests, isLoading } = useRequests();

  if (isLoading) {
    return <LayoutShell><div>Loading...</div></LayoutShell>;
  }

  const columns = {
    new: requests?.filter(r => r.status === "new") || [],
    in_progress: requests?.filter(r => r.status === "in_progress") || [],
    repaired: requests?.filter(r => r.status === "repaired") || [],
  };

  return (
    <LayoutShell>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Maintenance Requests</h1>
          <p className="text-muted-foreground mt-1">Track and manage repair tickets.</p>
        </div>
        <RequestDialog />
      </div>

      <Tabs defaultValue="board" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="board">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="board" className="mt-0">
          <div className="grid md:grid-cols-3 gap-6 h-[calc(100vh-250px)] overflow-hidden">
            <KanbanColumn title="New Requests" status="new" items={columns.new} color="bg-blue-50 border-blue-200" />
            <KanbanColumn title="In Progress" status="in_progress" items={columns.in_progress} color="bg-amber-50 border-amber-200" />
            <KanbanColumn title="Completed" status="repaired" items={columns.repaired} color="bg-green-50 border-green-200" />
          </div>
        </TabsContent>
        
        <TabsContent value="list">
          <div className="bg-white rounded-2xl p-6 text-center text-muted-foreground border border-dashed">
            List view implementation simplified for demo. Please use Board view.
          </div>
        </TabsContent>
      </Tabs>
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

function RequestCard({ request }: { request: MaintenanceRequest }) {
  const updateRequest = useUpdateRequest();

  const handleStatusChange = (newStatus: "new" | "in_progress" | "repaired") => {
    updateRequest.mutate({
      id: request.id,
      data: { status: newStatus }
    });
  };

  const priorityColor = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <Badge className={cn("capitalize shadow-none", priorityColor[request.priority])}>
            {request.priority}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange("new")}>Move to New</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>Move to In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("repaired")}>Mark Completed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
