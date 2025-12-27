import { useState, useEffect } from "react";
import { useTeams, useUsers, useTeamMembers, useEquipment } from "@/hooks/use-gear";
import { useRoute, useLocation } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Pencil, Users, MonitorSmartphone } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MultiSelect } from "@/components/ui/multi-select";

export default function TeamDetailPage() {
    const [, params] = useRoute("/teams/:id");
    const [_, setLocation] = useLocation();
    const isNew = params?.id === "new";
    const id = !isNew && params?.id ? parseInt(params.id) : 0;

    // Fetch data
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: teams, isLoading: isLoadingTeams } = useTeams();
    const { data: users } = useUsers();

    // Equipment count for smart button
    const { data: allEquipment } = useEquipment();
    const equipmentCount = allEquipment?.filter(e => e.maintenanceTeamId === id).length || 0;

    // We need to fetch the specific team details including members if editing
    // Currently useTeams returns list. If we updated backend to return members in list, we could use that.
    // The previous storage update added memberIds to getTeams.
    const team = teams?.find(t => t.id === id) as (typeof teams extends (infer U)[] ? U : never) & { memberIds?: number[] } | undefined;

    const [isEditing, setIsEditing] = useState(isNew);
    const [formData, setFormData] = useState<any>({ name: "", specialization: "", description: "", memberIds: [] });

    useEffect(() => {
        if (!isNew && team) {
            setFormData({
                ...team,
                memberIds: team.memberIds || []
            });
        }
    }, [team, isNew]);

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.teams.create.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create team");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [api.teams.list.path] });
            queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
            toast({ title: "Created", description: "Team created successfully." });
            setLocation(`/teams/${data.id}`);
            setIsEditing(false);
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to create team.", variant: "destructive" });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/teams/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update team");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.teams.list.path] });
            queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
            toast({ title: "Saved", description: "Team updated." });
            setIsEditing(false);
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to save team.", variant: "destructive" });
        }
    });

    const handleSave = () => {
        const payload = {
            name: formData.name,
            specialization: formData.specialization,
            description: formData.description,
            memberIds: formData.memberIds
        };

        if (isNew) {
            createMutation.mutate(payload);
        } else {
            updateMutation.mutate(payload);
        }
    };

    const handleCancel = () => {
        if (isNew) {
            setLocation("/teams");
            return;
        }
        if (team) {
            setFormData({
                ...team,
                memberIds: team.memberIds || []
            });
        }
        setIsEditing(false);
    };

    // Technician Options
    const technicianOptions = users
        ?.filter((u: any) => u.role === 'technician')
        .map((u: any) => ({ label: u.name, value: u.id.toString() })) || [];

    if (!isNew && isLoadingTeams) return <LayoutShell><div>Loading...</div></LayoutShell>;
    if (!isNew && !team) return <LayoutShell><div>Team not found</div></LayoutShell>;

    return (
        <LayoutShell>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <a href="/teams" className="hover:text-primary">Maintenance Teams</a>
                            <span>/</span>
                            <span>{isNew ? "New Team" : (formData.name || team?.name)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                                <Users className="h-8 w-8 text-indigo-500" />
                            </div>
                            <div>
                                {isEditing ? (
                                    <Input
                                        className="text-2xl font-bold h-auto py-1 px-2 -ml-2 w-[400px]"
                                        value={formData.name || ""}
                                        placeholder="Team Name"
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                ) : (
                                    <h1 className="text-3xl font-display font-bold text-slate-900">{formData.name}</h1>
                                )}
                                <p className="text-muted-foreground mt-1">
                                    {isEditing ? (
                                        <Input
                                            placeholder="Specialization"
                                            value={formData.specialization || ""}
                                            onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                            className="h-8 mt-1"
                                        />
                                    ) : (
                                        formData.specialization || "General"
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
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

                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Description</label>
                                {isEditing ? (
                                    <Textarea
                                        value={formData.description || ""}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                ) : (
                                    <p className="py-2 text-slate-700 whitespace-pre-wrap">{formData.description || "-"}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-500">Members</label>
                                {isEditing ? (
                                    <MultiSelect
                                        options={technicianOptions}
                                        selected={formData.memberIds?.map((id: number) => id.toString()) || []}
                                        onChange={(selected) => setFormData({ ...formData, memberIds: selected.map(s => parseInt(s)) })}
                                        placeholder="Select technicians..."
                                    />
                                ) : (
                                    <div className="flex flex-wrap gap-2 py-2">
                                        {formData.memberIds?.length > 0 ? (
                                            formData.memberIds.map((id: number) => {
                                                const user = users?.find((u: any) => u.id === id);
                                                return (
                                                    <div key={id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                        {user?.name || `User ${id}`}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <span className="text-slate-500 italic">No members assigned</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </LayoutShell>
    );
}
