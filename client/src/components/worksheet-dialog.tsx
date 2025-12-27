import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Clock } from "lucide-react";
import { format } from "date-fns";

interface WorksheetDialogProps {
    requestId: number;
    totalDuration?: number; // Estimated duration from request
}

interface WorksheetEntry {
    id: number;
    requestId: number;
    userId: number;
    startTime: string;
    endTime: string;
    description: string | null;
    createdAt: string;
}

export function WorksheetDialog({ requestId, totalDuration }: WorksheetDialogProps) {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        startTime: "",
        endTime: "",
        description: "",
    });
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Fetch worksheets for this request
    const { data: worksheets, isLoading } = useQuery<WorksheetEntry[]>({
        queryKey: [`/api/requests/${requestId}/worksheets`],
        queryFn: async () => {
            const res = await fetch(`/api/requests/${requestId}/worksheets`);
            if (!res.ok) throw new Error("Failed to fetch worksheets");
            return res.json();
        },
        enabled: open,
    });

    // Calculate total hours
    const calculateHours = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    };

    const totalLoggedHours = (worksheets || []).reduce((sum, w) => {
        return sum + calculateHours(w.startTime, w.endTime);
    }, 0);

    const isOvertime = totalDuration && totalLoggedHours > totalDuration;

    // Add worksheet mutation
    const addMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const res = await fetch(`/api/requests/${requestId}/worksheets`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to add worksheet entry");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Added", description: "Timesheet entry added." });
            queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}/worksheets`] });
            setFormData({ startTime: "", endTime: "", description: "" });
        },
    });

    // Delete worksheet mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/worksheets/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete worksheet entry");
        },
        onSuccess: () => {
            toast({ title: "Deleted", description: "Timesheet entry removed." });
            queryClient.invalidateQueries({ queryKey: [`/api/requests/${requestId}/worksheets`] });
        },
    });

    const handleAdd = () => {
        if (!formData.startTime || !formData.endTime) {
            toast({ title: "Missing fields", description: "Start and End times are required.", variant: "destructive" });
            return;
        }
        addMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-9 gap-2">
                    <Clock className="h-4 w-4" />
                    <div className="flex flex-col items-start leading-none text-xs">
                        <span className={`font-bold ${isOvertime ? "text-red-600" : ""}`}>
                            {totalLoggedHours.toFixed(1)} hrs
                        </span>
                        <span className="text-[10px] text-muted-foreground">Worksheet</span>
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Worksheet (Timesheet)</DialogTitle>
                    <DialogDescription>
                        Log time spent on this maintenance request.
                        {totalDuration && (
                            <span className="ml-2">
                                Estimated: <strong>{totalDuration}h</strong> | Logged:{" "}
                                <strong className={isOvertime ? "text-red-600" : ""}>{totalLoggedHours.toFixed(1)}h</strong>
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Add New Entry Form */}
                <div className="space-y-4 border-b pb-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Start Time</Label>
                            <Input
                                type="datetime-local"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>End Time</Label>
                            <Input
                                type="datetime-local"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Description (optional)</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What was done?"
                        />
                    </div>
                    <Button onClick={handleAdd} disabled={addMutation.isPending} className="w-full gap-2 bg-purple-700 hover:bg-purple-800">
                        <Plus className="h-4 w-4" /> Add Entry
                    </Button>
                </div>

                {/* List of Entries */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
                    {worksheets?.length === 0 && <p className="text-muted-foreground text-sm">No entries yet.</p>}
                    {worksheets?.map((w) => (
                        <div key={w.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md border">
                            <div className="text-sm">
                                <p className="font-medium">
                                    {format(new Date(w.startTime), "MMM d, h:mm a")} - {format(new Date(w.endTime), "h:mm a")}
                                </p>
                                <p className="text-muted-foreground text-xs">{w.description || "No description"}</p>
                                <p className="text-purple-700 font-semibold text-xs">
                                    {calculateHours(w.startTime, w.endTime).toFixed(1)} hours
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:bg-red-50"
                                onClick={() => deleteMutation.mutate(w.id)}
                                disabled={deleteMutation.isPending}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
