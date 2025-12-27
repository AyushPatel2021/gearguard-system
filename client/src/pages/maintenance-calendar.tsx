import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useRequests } from "@/hooks/use-gear";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function MaintenanceCalendarPage() {
    const { data: requests, isLoading } = useRequests();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [_, setLocation] = useLocation();

    if (isLoading) {
        return <LayoutShell><div>Loading...</div></LayoutShell>;
    }

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get first day of week offset (0 = Sunday, 1 = Monday, etc.)
    const startDayOfWeek = monthStart.getDay();

    // Get requests with scheduled dates
    const scheduledRequests = requests?.filter(r => r.scheduledDate) || [];

    const getRequestsForDay = (day: Date) => {
        return scheduledRequests.filter(r =>
            r.scheduledDate && isSameDay(new Date(r.scheduledDate), day)
        );
    };

    const priorityColor: Record<string, string> = {
        low: "bg-slate-100 text-slate-700 border-slate-200",
        medium: "bg-blue-100 text-blue-700 border-blue-200",
        high: "bg-red-100 text-red-700 border-red-200",
    };

    const statusColor: Record<string, string> = {
        new: "border-l-blue-500",
        in_progress: "border-l-amber-500",
        repaired: "border-l-green-500",
        scrap: "border-l-red-500",
    };

    return (
        <LayoutShell>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">Maintenance Calendar</h1>
                        <p className="text-muted-foreground mt-1">View scheduled maintenance tickets by date.</p>
                    </div>
                </div>

                {/* Calendar Navigation */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <CardTitle className="text-xl font-semibold">
                                {format(currentMonth, "MMMM yyyy")}
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells for days before month start */}
                            {Array.from({ length: startDayOfWeek }).map((_, i) => (
                                <div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/50 rounded-lg" />
                            ))}

                            {/* Day cells */}
                            {days.map(day => {
                                const dayRequests = getRequestsForDay(day);
                                const isToday = isSameDay(day, new Date());

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={cn(
                                            "min-h-[100px] p-2 rounded-lg border transition-colors",
                                            isToday ? "bg-primary/5 border-primary/30" : "bg-white border-slate-100 hover:border-slate-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "text-sm font-medium mb-1",
                                            isToday ? "text-primary" : "text-slate-700"
                                        )}>
                                            {format(day, "d")}
                                        </div>
                                        <div className="space-y-1">
                                            {dayRequests.slice(0, 3).map(req => (
                                                <div
                                                    key={req.id}
                                                    onClick={() => setLocation(`/requests/${req.id}`)}
                                                    className={cn(
                                                        "text-xs p-1 rounded border-l-2 bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow truncate",
                                                        statusColor[req.status]
                                                    )}
                                                    title={req.subject}
                                                >
                                                    {req.subject}
                                                </div>
                                            ))}
                                            {dayRequests.length > 3 && (
                                                <div className="text-xs text-muted-foreground text-center">
                                                    +{dayRequests.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </LayoutShell>
    );
}
