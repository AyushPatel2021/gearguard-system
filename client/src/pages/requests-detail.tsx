import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Save, StickyNote, Star, Construction, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { MultiSelect } from "@/components/ui/multi-select";
import { useEquipment, useTeams, useUsers, useCategories } from "@/hooks/use-gear";
import { WorksheetDialog } from "@/components/worksheet-dialog";

// Helper for Star Rating
function StarRating({ value, onChange, readonly = false }: { value: string, onChange?: (v: string) => void, readonly?: boolean }) {
    const priorityMap: Record<string, number> = { low: 1, medium: 2, high: 3 };
    const revMap: Record<number, string> = { 1: 'low', 2: 'medium', 3: 'high' };
    const numericValue = priorityMap[value] || 1;

    return (
        <div className="flex gap-1">
            {[1, 2, 3].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => !readonly && onChange?.(revMap[star])}
                    className="focus:outline-none"
                >
                    <Star
                        className={`h-5 w-5 ${star <= numericValue ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                </button>
            ))}
        </div>
    );
}

export default function RequestDetailPage() {
    const [, params] = useRoute("/requests/:id");
    const [_, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Hooks for data
    const { data: equipmentList } = useEquipment();
    const { data: teams } = useTeams();
    const { data: users } = useUsers();
    const { data: categories } = useCategories();

    const isNew = params?.id === "new";
    const id = !isNew && params?.id ? parseInt(params.id) : 0;

    // Fetch Request Data if editing
    const { data: request, isLoading } = useQuery({
        queryKey: [api.requests.get.path.replace(":id", id.toString())],
        queryFn: async () => {
            const res = await fetch(api.requests.get.path.replace(":id", id.toString()));
            if (!res.ok) throw new Error("Failed to fetch request");
            return res.json();
        },
        enabled: !isNew && id > 0
    });

    // Fetch Worksheets to calculate total logged hours
    const { data: worksheets } = useQuery<{ id: number; startTime: string; endTime: string }[]>({
        queryKey: [`/api/requests/${id}/worksheets`],
        queryFn: async () => {
            const res = await fetch(`/api/requests/${id}/worksheets`);
            return res.json();
        },
        enabled: !isNew && id > 0
    });

    const calculateHours = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return Math.max(0, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    };

    const totalLoggedHours = (worksheets || []).reduce((sum, w) => {
        return sum + calculateHours(w.startTime, w.endTime);
    }, 0);

    const [formData, setFormData] = useState<any>({
        subject: "",
        requestType: "corrective",
        maintenanceFor: "equipment", // Default
        equipmentId: null, // Nullable
        workCenter: "",
        description: "", // Used as Notes? Or Description?
        // User requested 'notes' and 'instructions' tabs. 
        // Schema has 'description' (required) and 'instructions' (optional).
        // Let's use 'description' for Notes tab? Or keep description as subject line desc?
        // Screenshot shows Subject as large text. Notes in notebook.
        // Let's assume 'notes' field maps to schema 'description' or new field?
        // Wait, schema has 'notes' on equipment, but request has 'description'.
        // Let's use 'description' for the Notes tab content for now as it makes sense.
        instructions: "",
        maintenanceTeamId: null,
        assignedTechnicianId: null,
        scheduledDate: "",
        durationHours: 0,
        priority: "medium",
        status: "new",
        createdBy: user?.id,
        technicianIds: [] // For M2M if needed, though form shows single Technician mostly? Screenshot shows "Technician". MultiSelect was requested previously. Let's support both or M2M?
        // Screenshot shows "Technician" singular in typical Odoo view, but User implemented M2M earlier for "Request-Technician".
        // Let's support the schema's M2M but maybe display as MultiSelect in form.
    });

    const [isEditing, setIsEditing] = useState(isNew);

    // Technicians for MultiSelect
    const technicianOptions = users?.filter((u: any) => u.role === 'technician').map((u: any) => ({ label: u.name, value: u.id.toString() })) || [];

    // Populate Form Data
    useEffect(() => {
        if (request && !isNew) {
            setFormData({
                ...request,
                scheduledDate: request.scheduledDate ? new Date(request.scheduledDate).toISOString().slice(0, 16) : "",
                durationHours: request.durationHours || 0,
                // Ensure technicianIds is array
                technicianIds: request.technicianIds || []
            });
            setIsEditing(false); // Default to view mode if existing
        } else if (isNew) {
            setIsEditing(true);
        }
    }, [request, isNew]);

    // Auto-Assignment Logic
    useEffect(() => {
        if (isNew && formData.maintenanceFor === 'equipment' && formData.equipmentId) {
            const selectedEq = equipmentList?.find(e => e.id === formData.equipmentId);
            if (selectedEq) {
                // Auto-fill Team
                if (selectedEq.maintenanceTeamId) {
                    setFormData((prev: any) => ({ ...prev, maintenanceTeamId: selectedEq.maintenanceTeamId }));
                }
                // Auto-fill Technician (Default)
                if (selectedEq.defaultTechnicianId) {
                    setFormData((prev: any) => {
                        // If using M2M, add to array. If using single assigned, set it.
                        // Schema has assignedTechnicianId AND request_technicians M2M. User asked for M2M earlier.
                        // Let's prefer M2M or sync them?
                        // Let's set assignedTechnicianId for compatibility and maybe add to technicianIds list
                        // But previous chat impl M2M. Let's assume we stick to M2M primarily or singular as primary?
                        // Screenshot shows "Technician" singular line.
                        // Let's stick to assignedTechnicianId for the main display line, but support M2M in background?
                        return { ...prev, assignedTechnicianId: selectedEq.defaultTechnicianId, technicianIds: [selectedEq.defaultTechnicianId] };
                    });
                }
            }
        }
    }, [formData.equipmentId, formData.maintenanceFor, isNew, equipmentList]);

    const mutationPath = isNew ? api.requests.create.path : api.requests.update.path.replace(":id", id.toString());
    const mutationMethod = isNew ? "POST" : "PATCH";

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            // Clean up payload
            const payload = {
                ...data,
                scheduledDate: data.scheduledDate ? new Date(data.scheduledDate).toISOString() : null,
                durationHours: parseInt(data.durationHours || 0),
                equipmentId: data.equipmentId ? parseInt(data.equipmentId) : null, // Handle null
                maintenanceTeamId: data.maintenanceTeamId ? parseInt(data.maintenanceTeamId) : null,
                assignedTechnicianId: data.assignedTechnicianId ? parseInt(data.assignedTechnicianId) : null,
            };

            const res = await fetch(mutationPath, {
                method: mutationMethod,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Failed to save request");
            return res.json();
        },
        onSuccess: (data) => {
            toast({ title: "Saved", description: "Request saved successfully" });
            queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
            if (isNew) {
                // Redirect to the newly created request's detail page
                setLocation(`/requests/${data.id}`);
            } else {
                setIsEditing(false);
                queryClient.invalidateQueries({ queryKey: [api.requests.get.path.replace(":id", id.toString())] });
            }
        }
    });

    const handleSave = () => {
        saveMutation.mutate(formData);
    };

    const StatusStages = ['new', 'in_progress', 'repaired', 'scrap'];

    // Helper to find display name
    const getUserName = (uid: number) => users?.find((u: any) => u.id === uid)?.name || 'Unknown';

    const getTeamName = (tid: number) => teams?.find(t => t.id === tid)?.name || '-';
    const getCatName = (cid: number) => categories?.find(c => c.id === cid)?.name || '-';

    const selectedEquipment = equipmentList?.find(e => e.id === formData.equipmentId);

    if (!isNew && isLoading) return <LayoutShell>Loading...</LayoutShell>;

    return (
        <LayoutShell>
            <div className="max-w-5xl mx-auto space-y-4">
                {/* Header Actions */}
                <div className="flex flex-col gap-4 mb-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => setLocation("/requests")} className="-ml-2">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Requests
                            </Button>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-semibold">{isNew ? "New" : (formData.subject || "Request")}</span>
                        </div>

                        {/* Smart Button - Worksheet Dialog */}
                        {!isNew && (
                            <WorksheetDialog requestId={id} totalDuration={formData.durationHours || 0} />
                        )}
                    </div>
                </div>

                {/* Control Panel / Stage Bar */}
                <div className="bg-white border rounded-lg p-2 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-purple-700 hover:bg-purple-800 text-white gap-2">
                                    <Save className="h-4 w-4" /> Save
                                </Button>
                                <Button variant="outline" onClick={() => {
                                    if (isNew) setLocation("/requests");
                                    else {
                                        setIsEditing(false);
                                        // Reset fields
                                        if (request) setFormData({
                                            ...request,
                                            scheduledDate: request.scheduledDate ? new Date(request.scheduledDate).toISOString().slice(0, 16) : "",
                                        });
                                    }
                                }}>Discard</Button>
                            </>
                        ) : (
                            <Button onClick={() => setIsEditing(true)} className="bg-purple-700 hover:bg-purple-800 text-white">
                                Edit
                            </Button>
                        )}
                    </div>

                    {/* Status Bar - Odoo Style (Breadcrumb-ish) */}
                    <div className="flex items-center border rounded-md overflow-hidden bg-slate-50">
                        {StatusStages.map((stage, idx) => {
                            const isActive = formData.status === stage;
                            const isPast = StatusStages.indexOf(formData.status) > idx;
                            return (
                                <button
                                    key={stage}
                                    onClick={() => isEditing && setFormData({ ...formData, status: stage })}
                                    disabled={!isEditing}
                                    className={`px-4 py-2 text-sm font-medium border-r last:border-r-0 transition-colors flex items-center gap-2
                                        ${isActive ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-100"}
                                        ${isPast ? "text-purple-700" : ""}
                                        ${!isEditing ? "cursor-default" : ""}
                                    `}
                                >
                                    {stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Sheet */}
                <div className="bg-white border rounded-lg shadow-sm relative min-h-[600px]">
                    <div className="p-8 md:p-10 space-y-8">
                        {/* Title Subject */}
                        <div className="max-w-3xl">
                            <Label className="text-purple-700 font-semibold uppercase text-xs tracking-wider">Subject</Label>
                            {isEditing ? (
                                <Input
                                    className="text-3xl font-display font-medium border-0 border-b-2 border-slate-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-purple-600 placeholder:text-slate-300 h-14"
                                    placeholder="e.g. Conveyor Belt Maintenance"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                />
                            ) : (
                                <h1 className="text-3xl font-display font-medium py-2 border-b-2 border-transparent">{formData.subject}</h1>
                            )}
                        </div>

                        {/* Top Form Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-[120px_1fr] items-center gap-4 min-h-[36px]">
                                    <Label className="text-right text-slate-500">Created By</Label>
                                    <div className="font-medium text-slate-900">{getUserName(formData.createdBy)}</div>
                                </div>

                                <div className="grid grid-cols-[120px_1fr] items-center gap-4 min-h-[36px]">
                                    <Label className="text-right text-slate-500">Maintenance For</Label>
                                    {isEditing ? (
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio"
                                                    checked={formData.maintenanceFor === 'equipment'}
                                                    onChange={() => setFormData({ ...formData, maintenanceFor: 'equipment' })}
                                                    className="accent-purple-600"
                                                /> Equipment
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio"
                                                    checked={formData.maintenanceFor === 'work_center'}
                                                    onChange={() => setFormData({ ...formData, maintenanceFor: 'work_center' })}
                                                    className="accent-purple-600"
                                                /> Work Center
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="text-slate-900 capitalize">{formData.maintenanceFor?.replace('_', ' ')}</div>
                                    )}
                                </div>

                                {formData.maintenanceFor === 'equipment' ? (
                                    <>
                                        <div className="grid grid-cols-[120px_1fr] items-center gap-4 min-h-[36px]">
                                            <Label className="text-right text-slate-500 font-bold text-slate-700">Equipment</Label>
                                            {isEditing ? (
                                                <Select
                                                    value={formData.equipmentId?.toString()}
                                                    onValueChange={v => setFormData({ ...formData, equipmentId: parseInt(v) })}
                                                >
                                                    <SelectTrigger className="border-0 border-b border-slate-300 rounded-none px-0 h-9 focus:ring-0">
                                                        <SelectValue placeholder="Select Equipment..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {equipmentList?.map(eq => (
                                                            <SelectItem key={eq.id} value={eq.id.toString()}>{eq.name} ({eq.serialNumber})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="text-purple-700 font-medium">{selectedEquipment?.name || '-'}</div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-[120px_1fr] items-center gap-4 min-h-[36px]">
                                            <Label className="text-right text-slate-500">Category</Label>
                                            <div className="text-slate-700 border-b border-transparent py-1">
                                                {selectedEquipment ? getCatName(selectedEquipment.categoryId) : '-'}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-[120px_1fr] items-center gap-4 min-h-[36px]">
                                        <Label className="text-right text-slate-500">Work Center</Label>
                                        {isEditing ? (
                                            <Input
                                                value={formData.workCenter || ""}
                                                onChange={e => setFormData({ ...formData, workCenter: e.target.value })}
                                                className="border-0 border-b border-slate-300 rounded-none px-0 h-9 focus-visible:ring-0"
                                                placeholder="Enter Work Center..."
                                            />
                                        ) : (
                                            <div className="text-slate-900">{formData.workCenter || '-'}</div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-[120px_1fr] items-center gap-4 min-h-[36px]">
                                    <Label className="text-right text-slate-500">Request Date</Label>
                                    <div className="text-slate-700">{request?.createdAt ? format(new Date(request.createdAt), 'MM/dd/yyyy') : format(new Date(), 'MM/dd/yyyy')}</div>
                                </div>

                                <div className="grid grid-cols-[120px_1fr] items-start gap-4 pt-2 min-h-[36px]">
                                    <Label className="text-right text-slate-500 mt-1">Request Type</Label>
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio"
                                                    checked={formData.requestType === 'corrective'}
                                                    onChange={() => setFormData({ ...formData, requestType: 'corrective' })}
                                                    className="accent-purple-600"
                                                /> Corrective
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio"
                                                    checked={formData.requestType === 'preventive'}
                                                    onChange={() => setFormData({ ...formData, requestType: 'preventive' })}
                                                    className="accent-purple-600"
                                                /> Preventive
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="text-slate-900 capitalize">{formData.requestType}</div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-[120px_1fr] items-center gap-4 min-h-[36px]">
                                    <Label className="text-right text-slate-500">Team</Label>
                                    {isEditing ? (
                                        <Select
                                            value={formData.maintenanceTeamId?.toString()}
                                            onValueChange={v => setFormData({ ...formData, maintenanceTeamId: parseInt(v) })}
                                        >
                                            <SelectTrigger className="border-0 border-b border-slate-300 rounded-none px-0 h-9 focus:ring-0">
                                                <SelectValue placeholder="Select Team..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teams?.map(t => (
                                                    <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="text-slate-900">{getTeamName(formData.maintenanceTeamId)}</div>
                                    )}
                                </div>

                                <div className="grid grid-cols-[120px_1fr] items-center gap-4 min-h-[36px]">
                                    <Label className="text-right text-slate-500">Technician</Label>
                                    {isEditing ? (
                                        <Select
                                            value={formData.assignedTechnicianId?.toString()}
                                            onValueChange={v => setFormData({ ...formData, assignedTechnicianId: parseInt(v) })}
                                        >
                                            <SelectTrigger className="border-0 border-b border-slate-300 rounded-none px-0 h-9 focus:ring-0">
                                                <SelectValue placeholder="Select Technician..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users?.filter((u: any) => u.role === 'technician').map((u: any) => (
                                                    <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="text-slate-900">{getUserName(formData.assignedTechnicianId)}</div>
                                    )}
                                </div>

                                <div className="grid grid-cols-[120px_1fr] items-center gap-4 min-h-[36px]">
                                    <Label className="text-right text-slate-500">Scheduled Date</Label>
                                    {isEditing ? (
                                        <Input
                                            type="datetime-local"
                                            value={formData.scheduledDate || ""}
                                            onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                                            className="border-0 border-b border-slate-300 rounded-none px-0 h-9 focus-visible:ring-0"
                                        />
                                    ) : (
                                        <div className="text-slate-900">
                                            {formData.scheduledDate ? format(new Date(formData.scheduledDate), "MM/dd/yyyy h:mm a") : "-"}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-[120px_1fr] items-center gap-4 min-h-[36px]">
                                    <Label className="text-right text-slate-500">Duration</Label>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={formData.durationHours}
                                                onChange={e => setFormData({ ...formData, durationHours: e.target.value })}
                                                className="border-0 border-b border-slate-300 rounded-none px-0 h-9 focus-visible:ring-0 w-24 text-right"
                                            />
                                            <span className="text-slate-500 text-sm">hours</span>
                                        </div>
                                    ) : (
                                        <div className={`${totalLoggedHours > (formData.durationHours || 0) ? 'text-red-600 font-semibold' : 'text-slate-900'}`}>
                                            {formData.durationHours} hours {totalLoggedHours > (formData.durationHours || 0) && `(${totalLoggedHours.toFixed(1)}h logged)`}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-[120px_1fr] items-center gap-4 min-h-[36px]">
                                    <Label className="text-right text-slate-500">Priority</Label>
                                    <StarRating value={formData.priority} onChange={v => setFormData({ ...formData, priority: v })} readonly={!isEditing} />
                                </div>
                            </div>
                        </div>

                        {/* Notebook Tabs */}
                        <div className="mt-8">
                            <Tabs defaultValue="notes" className="w-full">
                                <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0">
                                    <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">Notes</TabsTrigger>
                                    <TabsTrigger value="instructions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2">Instructions</TabsTrigger>
                                </TabsList>
                                <TabsContent value="notes" className="pt-4">
                                    {isEditing ? (
                                        <Textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Add internal notes..."
                                            className="min-h-[150px] border-slate-200"
                                        />
                                    ) : (
                                        <div className="min-h-[150px] text-slate-700 whitespace-pre-wrap py-2">{formData.description || "No notes."}</div>
                                    )}
                                </TabsContent>
                                <TabsContent value="instructions" className="pt-4">
                                    {isEditing ? (
                                        <Textarea
                                            value={formData.instructions || ""}
                                            onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                                            placeholder="Add maintenance instructions..."
                                            className="min-h-[150px] border-slate-200"
                                        />
                                    ) : (
                                        <div className="min-h-[150px] text-slate-700 whitespace-pre-wrap py-2">{formData.instructions || "No instructions."}</div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </LayoutShell>
    );
}
