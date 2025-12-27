import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { WorkCenter, insertWorkCenterSchema } from "@shared/schema";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Pencil, Factory, RotateCcw, Trash2, ArrowLeft, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useWorkCenters, useWorkCenterDetail } from "@/hooks/use-gear";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

// Schema valid for form usage
const formSchema = insertWorkCenterSchema.extend({
    alternativeWorkCenters: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

export default function WorkCenterDetailPage() {
    const [, params] = useRoute("/work-centers/:id");
    const [_, setLocation] = useLocation();
    const isNew = params?.id === "new";
    const id = !isNew && params?.id ? parseInt(params.id) : 0;



    const { data: workCenter, isLoading } = useWorkCenterDetail(id);

    const [isEditing, setIsEditing] = useState(isNew);
    const [formData, setFormData] = useState<FormValues>({
        name: "",
        code: "",
        tag: "",
        alternativeWorkCenters: [],
        costPerHour: 0,
        capacity: 1,
        timeEfficiency: 100,
        oeeTarget: 0,
        status: "active",
    });

    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Load data
    useEffect(() => {
        if (!isNew && workCenter) {
            setFormData({
                name: workCenter.name,
                code: workCenter.code,
                tag: workCenter.tag || "",
                alternativeWorkCenters: (workCenter.alternativeWorkCenters as string[]) || [],
                costPerHour: workCenter.costPerHour || 0,
                capacity: workCenter.capacity || 1,
                timeEfficiency: workCenter.timeEfficiency || 100,
                oeeTarget: workCenter.oeeTarget || 0,
                status: workCenter.status,
            });
        }
    }, [workCenter, isNew]);

    const createMutation = useMutation({
        mutationFn: async (values: FormValues) => {
            const res = await fetch(api.workCenters.create.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to create work center");
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [api.workCenters.list.path] });
            // Prime the cache for the new item to avoid loading state
            queryClient.setQueryData([api.workCenters.get.path, data.id], data);

            toast({ title: "Success", description: "Work center created successfully" });
            setLocation(`/work-centers/${data.id}`);
            setIsEditing(false);
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (values: FormValues) => {
            const path = api.workCenters.update.path.replace(":id", String(id));
            const res = await fetch(path, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to update work center");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.workCenters.list.path] });
            queryClient.invalidateQueries({ queryKey: [api.workCenters.get.path, id] });
            toast({ title: "Success", description: "Work center updated successfully" });
            setIsEditing(false);
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const handleSave = () => {
        // Validate basics
        if (!formData.name || !formData.code) {
            toast({ title: "Validation Error", description: "Name and Code are required", variant: "destructive" });
            return;
        }

        if (isNew) {
            createMutation.mutate(formData);
        } else {
            updateMutation.mutate(formData);
        }
    };

    const handleCancel = () => {
        if (isNew) {
            setLocation("/work-centers");
        } else {
            // Reset to original
            if (workCenter) {
                setFormData({
                    name: workCenter.name,
                    code: workCenter.code,
                    tag: workCenter.tag || "",
                    alternativeWorkCenters: (workCenter.alternativeWorkCenters as string[]) || [],
                    costPerHour: workCenter.costPerHour || 0,
                    capacity: workCenter.capacity || 1,
                    timeEfficiency: workCenter.timeEfficiency || 100,
                    oeeTarget: workCenter.oeeTarget || 0,
                    status: workCenter.status,
                });
            }
            setIsEditing(false);
        }
    };

    const handleStatusToggle = () => {
        const newStatus = formData.status === 'active' ? 'scrapped' : 'active';
        setFormData({ ...formData, status: newStatus });
    };

    // Helper for array manipulation
    const addAlternative = () => setFormData({ ...formData, alternativeWorkCenters: [...formData.alternativeWorkCenters, ""] });
    const removeAlternative = (idx: number) => setFormData({ ...formData, alternativeWorkCenters: formData.alternativeWorkCenters.filter((_, i) => i !== idx) });
    const updateAlternative = (idx: number, val: string) => {
        const newArr = [...formData.alternativeWorkCenters];
        newArr[idx] = val;
        setFormData({ ...formData, alternativeWorkCenters: newArr });
    };

    if (!isNew && !workCenter) return <LayoutShell><div>Loading...</div></LayoutShell>;

    return (
        <LayoutShell>
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Button variant="ghost" size="sm" onClick={() => setLocation("/work-centers")} className="-ml-2">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Work Centers
                            </Button>
                            <span>/</span>
                            <span>{isNew ? "New" : (formData.name || workCenter?.name)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-orange-50 rounded-lg flex items-center justify-center border border-orange-100">
                                <Factory className="h-8 w-8 text-orange-500" />
                            </div>
                            <div>
                                {isEditing ? (
                                    <Input
                                        className="text-2xl font-bold h-auto py-1 px-2 -ml-2 w-[400px]"
                                        value={formData.name || ""}
                                        placeholder="Work Center Name"
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                ) : (
                                    <h1 className="text-3xl font-display font-bold text-slate-900">{formData.name}</h1>
                                )}
                                <div className="flex gap-2 mt-2 items-center">
                                    {isEditing ? (
                                        <Input
                                            className="h-6 w-32 px-1 text-xs"
                                            placeholder="Code"
                                            value={formData.code || ""}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        />
                                    ) : (
                                        <Badge variant="outline" className="font-mono">{formData.code}</Badge>
                                    )}
                                    <Badge variant={formData.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                                        {formData.status === 'scrapped' ? 'Inactive' : formData.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {isEditing && (
                                <Button
                                    variant={formData.status === 'active' ? "destructive" : "secondary"}
                                    onClick={handleStatusToggle}
                                    className="gap-2"
                                >
                                    {formData.status === 'active' ? <Trash2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                                    {formData.status === 'active' ? "Deactivate" : "Activate"}
                                </Button>
                            )}

                            {!isEditing ? (
                                <Button onClick={() => setIsEditing(true)} className="gap-2">
                                    <Pencil className="h-4 w-4" /> Edit
                                </Button>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={handleCancel}>Discard</Button>
                                    <Button onClick={handleSave} className="gap-2" disabled={createMutation.isPending || updateMutation.isPending}>
                                        <Save className="h-4 w-4" /> Save
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {/* Left Column */}
                            <div className="space-y-6">
                                <Field label="Tag" isEditing={isEditing}>
                                    {isEditing ? (
                                        <Input value={formData.tag || ""} onChange={e => setFormData({ ...formData, tag: e.target.value })} />
                                    ) : (
                                        <span className="text-slate-900">{formData.tag || "-"}</span>
                                    )}
                                </Field>

                                <Field label="Cost per Hour" isEditing={isEditing}>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">$</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.costPerHour ?? 0}
                                                onChange={e => setFormData({ ...formData, costPerHour: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(formData.costPerHour || 0)}</span>
                                    )}
                                </Field>

                                <Field label="Capacity" isEditing={isEditing}>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={formData.capacity ?? 0}
                                            onChange={e => setFormData({ ...formData, capacity: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                                        />
                                    ) : (
                                        <span className="text-slate-900">{formData.capacity}</span>
                                    )}
                                </Field>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <Field label="Time Efficiency %" isEditing={isEditing}>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={formData.timeEfficiency ?? 100}
                                            onChange={e => setFormData({ ...formData, timeEfficiency: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                                        />
                                    ) : (
                                        <span className="text-slate-900">{formData.timeEfficiency}%</span>
                                    )}
                                </Field>

                                <Field label="OEE Target" isEditing={isEditing}>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={formData.oeeTarget ?? 0}
                                            onChange={e => setFormData({ ...formData, oeeTarget: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
                                        />
                                    ) : (
                                        <span className="text-slate-900">{formData.oeeTarget}</span>
                                    )}
                                </Field>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Alternative Work Centers</h3>
                            {isEditing ? (
                                <div className="space-y-3">
                                    {formData.alternativeWorkCenters.map((alt, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input value={alt} onChange={e => updateAlternative(idx, e.target.value)} placeholder="Alternative WC Code/Name" />
                                            <Button variant="ghost" size="icon" onClick={() => removeAlternative(idx)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={addAlternative} className="mt-2">
                                        <Plus className="h-4 w-4 mr-2" /> Add Alternative
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {formData.alternativeWorkCenters.length > 0 ? (
                                        formData.alternativeWorkCenters.map((alt, idx) => (
                                            <Badge key={idx} variant="secondary">{alt}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-slate-500 italic">No alternative work centers configured.</span>
                                    )}
                                </div>
                            )}
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
