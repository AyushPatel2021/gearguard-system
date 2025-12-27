import { useAuth } from "@/hooks/use-auth";
import { useRequests, useEquipment, useActivityLogs } from "@/hooks/use-gear";
import { LayoutShell } from "@/components/layout-shell";
import { KpiCard } from "@/components/kpi-card";
import { RequestDialog } from "@/components/request-dialog";
import { Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: requests, isLoading: requestsLoading } = useRequests();
  const { data: equipment, isLoading: equipmentLoading } = useEquipment();
  const { data: logs, isLoading: logsLoading } = useActivityLogs();

  if (requestsLoading || equipmentLoading || logsLoading) {
    return <DashboardSkeleton />;
  }

  // Calculate KPIs
  const openRequests = requests?.filter(r => r.status === "new" || r.status === "in_progress").length || 0;
  const highPriority = requests?.filter(r => r.priority === "high" && r.status !== "repaired").length || 0;
  const equipmentDown = equipment?.filter(e => e.status === "scrapped").length || 0; // Using scrapped as 'down' for simplicity
  const totalEquipment = equipment?.length || 0;

  // Chart Data Preparation
  const statusDistribution = [
    { name: "New", value: requests?.filter(r => r.status === "new").length || 0, color: "#3B82F6" },
    { name: "In Progress", value: requests?.filter(r => r.status === "in_progress").length || 0, color: "#F59E0B" },
    { name: "Repaired", value: requests?.filter(r => r.status === "repaired").length || 0, color: "#10B981" },
  ];

  const priorityData = [
    { name: "Low", requests: requests?.filter(r => r.priority === "low").length || 0 },
    { name: "Medium", requests: requests?.filter(r => r.priority === "medium").length || 0 },
    { name: "High", requests: requests?.filter(r => r.priority === "high").length || 0 },
  ];

  return (
    <LayoutShell>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name}. Here's what's happening today.
          </p>
        </div>
        <RequestDialog />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Open Requests"
          value={openRequests}
          icon={<Clock className="h-6 w-6" />}
          trend={{ value: "+2 from yesterday", isPositive: false }}
          className="border-l-4 border-l-blue-500"
        />
        <KpiCard
          title="High Priority"
          value={highPriority}
          icon={<AlertTriangle className="h-6 w-6" />}
          description="Requires immediate attention"
          className="border-l-4 border-l-red-500"
        />
        <KpiCard
          title="Equipment Status"
          value={`${requests?.filter(r => r.status === "in_progress").length || 0} / ${requests?.length || 0}`}
          icon={<Activity className="h-6 w-6" />}
          description="Current inprogress from total"
          className="border-l-4 border-l-green-500"
        />
        <KpiCard
          title="Resolved This Month"
          value={requests?.filter(r => r.status === "repaired" && new Date(r.createdAt).getMonth() === new Date().getMonth() && new Date(r.createdAt).getFullYear() === new Date().getFullYear()).length || 0}
          icon={<CheckCircle2 className="h-6 w-6" />}
          trend={{ value: "+12% vs last month", isPositive: true }}
          className="border-l-4 border-l-purple-500"
        />
      </div>

      {/* Pending Requests List */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Your Pending Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left rounded-l-lg">ID</th>
                <th className="px-4 py-3 text-left">Problem</th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left rounded-r-lg">Date</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {requests?.filter(r => r.createdBy === user?.id && r.status !== "repaired" && r.status !== "scrap").map((request) => (
                <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">#{request.id}</td>
                  <td className="px-4 py-3 text-slate-600">{request.description?.substring(0, 50) || "No description"}...</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${request.priority === "high" ? "bg-red-100 text-red-700" :
                      request.priority === "medium" ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                      {request.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize text-slate-600">{request.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{format(new Date(request.createdAt), "MMM d, yyyy")}</td>
                </tr>
              ))}
              {(!requests?.filter(r => r.createdBy === user?.id && r.status !== "repaired" && r.status !== "scrap").length) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No pending requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6">Request Priority Breakdown</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6">Status Distribution</h3>
            <div className="h-[300px] w-full flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-slate-600 font-medium">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold">Recent Activity</h3>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[600px]">
              {logs?.slice(0, 8).map((log) => (
                <div key={log.id} className="flex gap-4">
                  <div className="mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/10" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-900 font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {log.referenceType} #{log.referenceId} • {format(new Date(log.timestamp), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
              {!logs?.length && (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}

function DashboardSkeleton() {
  return (
    <LayoutShell>
      <div className="space-y-8">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}