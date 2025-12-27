import { useState, useEffect } from "react";
import { useEquipmentDetail, useCategories, useTeams, useUsers, useCreateEquipment, useRequests } from "@/hooks/use-gear";
import { useRoute, useLocation } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Pencil, MonitorSmartphone, Calendar as CalendarIcon, RotateCcw, Trash2, Wrench } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function EquipmentDetailPage() {
    const [, params] = useRoute("/equipment/:id");
    const [_, setLocation] = useLocation();
    const isNew = params?.id === "new";
    const id = !isNew && params?.id ? parseInt(params.id) : 0;

    // Only fetch if not new
    const { data: equipment, isLoading } = useEquipmentDetail(id);
    const { data: categories } = useCategories();
    const { data: teams } = useTeams();
    const { data: users } = useUsers();
    const { data: requests } = useRequests();

    const [isEditing, setIsEditing] = useState(isNew);
    const [formData, setFormData] = useState<any>({ status: 'active' });

    const queryClient = useQueryClient();
    const { toast } = useToast();
    const createEquipment = useCreateEquipment();

    // Stats
    const requestCount = requests?.filter(r => r.equipmentId === id).length || 0;

    useEffect(() => {
        if (!isNew && equipment) {
            setFormData({
                ...equipment,
                assignedDate: equipment.assignedDate ? new Date(equipment.assignedDate) : undefined,
                scrapDate: equipment.scrapDate ? new Date(equipment.scrapDate) : undefined,
            });
        }
    }, [equipment, isNew]);

    // Status Logic
    useEffect(() => {
        if (formData.scrapDate) {
            setFormData((prev: any) => ({ ...prev, status: 'scrapped' }));
        } else if (formData.status === 'scrapped' && !formData.scrapDate) {
            setFormData((prev: any) => ({ ...prev, status: 'active' }));
        }
    }, [formData.scrapDate]);

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/equipment/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update equipment");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.equipment.get.path, id] });
            queryClient.invalidateQueries({ queryKey: [api.equipment.list.path] });
            toast({ title: "Saved", description: "Equipment details updated." });
            setIsEditing(false);
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
        }
    });

    const handleSave = () => {
        const payload = {
            name: formData.name,
            serialNumber: formData.serialNumber, // Important for new items
            categoryId: formData.categoryId,
            maintenanceTeamId: formData.maintenanceTeamId,
            employeeId: formData.employeeId,
            defaultTechnicianId: formData.defaultTechnicianId,
            location: formData.location,
            notes: formData.notes,
            status: formData.status,
            assignedDate: formData.assignedDate ? formData.assignedDate.toISOString() : null,
            scrapDate: formData.scrapDate ? formData.scrapDate.toISOString() : null,
            // Ensure remove removed fields from payload if they linger in formData
        };

        if (isNew) {
            // Validate required fields for creation
            if (!payload.name || !payload.serialNumber || !payload.categoryId) {
                toast({ title: "Missing Fields", description: "Name, Serial Number, and Category are required.", variant: "destructive" });
                return;
            }
            createEquipment.mutate(payload, {
                onSuccess: (data) => {
                    setLocation(`/equipment/${data.id}`);
                    setIsEditing(false);
                }
            });
        } else {
            updateMutation.mutate(payload);
        }
    };

    const handleCancel = () => {
        if (isNew) {
            setLocation("/equipment");
            return;
        }
        if (equipment) {
            setFormData({
                ...equipment,
                assignedDate: equipment.assignedDate ? new Date(equipment.assignedDate) : undefined,
                scrapDate: equipment.scrapDate ? new Date(equipment.scrapDate) : undefined,
            });
        }
        setIsEditing(false);
    };

    const handleScrapToggle = () => {
        if (formData.status === 'active') {
            // Set to scrapped, set scrapDate to today
            const today = new Date();
            setFormData({ ...formData, status: 'scrapped', scrapDate: today });
        } else {
            // Set to active, clear scrapDate
            setFormData({ ...formData, status: 'active', scrapDate: undefined });
        }
    };

    if (!isNew && isLoading) return <LayoutShell><div>Loading...</div></LayoutShell>;
    if (!isNew && !equipment) return <LayoutShell><div>Equipment not found</div></LayoutShell>;

    return (
        <LayoutShell>
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <a href="/equipment" className="hover:text-primary">Equipment</a>
                            <span>/</span>
                            <span>{isNew ? "New" : (formData.name || equipment?.name)}</span>
                        </div>

                        {!isNew && (
                            <Button variant="outline" className="h-9 gap-2" onClick={() => setLocation(`/requests?equipmentId=${id}`)}>
                                <Wrench className="h-4 w-4" />
                                <div className="flex flex-col items-start leading-none text-xs">
                                    <span className="font-bold">{requestCount}</span>
                                    <span className="text-[10px] text-muted-foreground">Maintenance</span>
                                </div>
                            </Button>
                        )}
                    </div>

                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                                {isNew ? <MonitorSmartphone className="h-8 w-8 text-slate-500" /> : <MonitorSmartphone className="h-8 w-8 text-slate-500" />}
                            </div>
                            <div>
                                {isEditing ? (
                                    <Input
                                        className="text-2xl font-bold h-auto py-1 px-2 -ml-2 w-[400px]"
                                        value={formData.name || ""}
                                        placeholder="Equipment Name"
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                ) : (
                                    <h1 className="text-3xl font-display font-bold text-slate-900">{formData.name}</h1>
                                )}
                                <div className="flex gap-2 mt-2 items-center">
                                    {isEditing ? (
                                        <Input
                                            className="h-6 w-32 px-1 text-xs"
                                            placeholder="Serial Number"
                                            value={formData.serialNumber || ""}
                                            onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
                                        />
                                    ) : (
                                        <Badge variant="outline">{formData.serialNumber}</Badge>
                                    )}
                                    <Badge variant={formData.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                                        {formData.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {/* Status Toggle Button - Only visible in Edit Mode to control logic or maybe always? 
                                User asked "if anyone fill the scrap date then it become scap and not active and also if we need a option to change the state to active to scrap"
                                Let's put a "Scrap" / "Reactivate" button. 
                             */}
                            {isEditing && (
                                <Button
                                    variant={formData.status === 'active' ? "destructive" : "secondary"}
                                    onClick={handleScrapToggle}
                                    className="gap-2"
                                >
                                    {formData.status === 'active' ? <Trash2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                                    {formData.status === 'active' ? "Scrap" : "Reactivate"}
                                </Button>
                            )}

                            {!isEditing ? (
                                <Button onClick={() => setIsEditing(true)} className="gap-2">
                                    <Pencil className="h-4 w-4" /> Edit
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={handleCancel}>Discard</Button>
                                    <Button onClick={handleSave} className="gap-2">
                                        <Save className="h-4 w-4" /> Save
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Form Card */}
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">

                            {/* Left Column */}
                            <div className="space-y-6">
                                <Field label="Equipment Category" isEditing={isEditing}>
                                    {isEditing ? (
                                        <Select value={formData.categoryId?.toString()} onValueChange={v => setFormData({ ...formData, categoryId: parseInt(v) })}>
                                            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                            <SelectContent>
                                                {categories?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className="text-slate-900 font-medium">{categories?.find((c: any) => c.id === formData.categoryId)?.name || "-"}</span>
                                    )}
                                </Field>

                                {/* Removed Company field as requested */}

                                <Field label="Maintenance Team" isEditing={isEditing}>
                                    {isEditing ? (
                                        <Select value={formData.maintenanceTeamId?.toString() || ""} onValueChange={v => setFormData({ ...formData, maintenanceTeamId: v ? parseInt(v) : null })}>
                                            <SelectTrigger><SelectValue placeholder="Select Team" /></SelectTrigger>
                                            <SelectContent>
                                                {teams?.map((t: any) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className="text-slate-900">{teams?.find((t: any) => t.id === formData.maintenanceTeamId)?.name || "-"}</span>
                                    )}
                                </Field>

                                <Field label="Assigned Date" isEditing={isEditing}>
                                    <DatePicker
                                        date={formData.assignedDate}
                                        setDate={(d) => setFormData({ ...formData, assignedDate: d })}
                                        disabled={!isEditing}
                                    />
                                </Field>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <Field label="Technician" isEditing={isEditing}>
                                    {isEditing ? (
                                        <Select value={formData.defaultTechnicianId?.toString() || ""} onValueChange={v => setFormData({ ...formData, defaultTechnicianId: v ? parseInt(v) : null })}>
                                            <SelectTrigger><SelectValue placeholder="Select Technician" /></SelectTrigger>
                                            <SelectContent>
                                                {users?.filter((u: any) => u.role === 'technician').map((u: any) => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className="text-slate-900">{users?.find((u: any) => u.id === formData.defaultTechnicianId)?.name || "-"}</span>
                                    )}
                                </Field>

                                <Field label="Employee" isEditing={isEditing}>
                                    {isEditing ? (
                                        <Select value={formData.employeeId?.toString() || ""} onValueChange={v => setFormData({ ...formData, employeeId: v ? parseInt(v) : null })}>
                                            <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                                            <SelectContent>
                                                {users?.filter((u: any) => u.role === 'employee').map((u: any) => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <span className="text-slate-900">{users?.find((u: any) => u.id === formData.employeeId)?.name || "-"}</span>
                                    )}
                                </Field>

                                <Field label="Scrap Date" isEditing={isEditing}>
                                    <DatePicker
                                        date={formData.scrapDate}
                                        setDate={(d) => setFormData({ ...formData, scrapDate: d })}
                                        disabled={!isEditing}
                                    />
                                </Field>

                                <Field label="Used in Location" isEditing={isEditing}>
                                    {isEditing ? (
                                        <Input value={formData.location || ""} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                    ) : (
                                        <span className="text-slate-900">{formData.location || "-"}</span>
                                    )}
                                </Field>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Description</h3>
                                {isEditing ? (
                                    <Textarea
                                        value={formData.notes || ""}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="min-h-[100px]"
                                    />
                                ) : (
                                    <p className="text-slate-700 whitespace-pre-wrap">{formData.notes || "No description provided."}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </LayoutShell>
    );
}

function Field({ label, children, isEditing }: { label: string, children: React.ReactNode, isEditing: boolean }) {
    return (
        <div className="grid grid-cols-[140px_1fr] items-center gap-4 min-h-[40px]">
            <label className="text-sm font-medium text-slate-500">{label}</label>
            <div className={cn("text-sm", isEditing ? "" : "py-2 border-b border-transparent")}>
                {children}
            </div>
        </div>
    );
}

function DatePicker({ date, setDate, disabled }: { date?: Date, setDate: (d?: Date) => void, disabled?: boolean }) {
    if (disabled) {
        return <span className="text-slate-900">{date ? format(date, "PPP") : "-"}</span>;
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
