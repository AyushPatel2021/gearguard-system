import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, UserCircle, Pencil } from "lucide-react";
import { useTeams } from "@/hooks/use-gear";
import { MultiSelect } from "@/components/ui/multi-select";


export default function UserDetailPage() {
    const [, params] = useRoute("/users/:id");
    const [_, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: teams } = useTeams();


    const isNew = params?.id === "new";
    const id = !isNew && params?.id ? parseInt(params.id) : 0;

    // Fetch User Data if editing
    const { data: user, isLoading } = useQuery({
        queryKey: [`/api/users/${id}`],
        queryFn: async () => {
            const res = await fetch(`/api/users/${id}`);
            if (!res.ok) throw new Error("Failed to fetch user");
            return res.json();
        },
        enabled: !isNew && id > 0
    });

    const [isEditing, setIsEditing] = useState(isNew);
    const [formData, setFormData] = useState<any>({
        name: "",
        username: "",
        email: "",
        password: "",
        teamIds: [],
        isActive: true,
    });


    useEffect(() => {
        if (user && !isNew) {
            setFormData({
                ...user,
                password: "", // Don't show password
            });
            setIsEditing(false);
        } else if (isNew) {
            setIsEditing(true);
        }
    }, [user, isNew]);

    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            const url = isNew ? "/api/users" : `/api/users/${id}`;
            const method = isNew ? "POST" : "PATCH";

            // Prepare payload - don't send empty password on update
            const payload = { ...data };
            if (!isNew && !payload.password) {
                delete payload.password;
            }

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to save user");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast({ title: "Saved", description: "User saved successfully" });
            queryClient.invalidateQueries({ queryKey: ["/api/users"] });
            if (isNew) {
                setLocation(`/users/${data.id}`);
            } else {
                setIsEditing(false);
                queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
            }
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const handleSave = () => {
        if (isNew && !formData.password) {
            toast({ title: "Missing Password", description: "Password is required for new users.", variant: "destructive" });
            return;
        }
        saveMutation.mutate(formData);
    };

    if (!isNew && isLoading) return <LayoutShell>Loading...</LayoutShell>;

    return (
        <LayoutShell>
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={() => setLocation("/users")} className="-ml-2">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Users
                            </Button>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-semibold">{isNew ? "New User" : formData.name}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                                <UserCircle className="h-10 w-10 text-slate-400" />
                            </div>
                            <div>
                                {isEditing ? (
                                    <Input
                                        className="text-2xl font-bold h-auto py-1 px-2 -ml-2 w-[300px]"
                                        value={formData.name}
                                        placeholder="Full Name"
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                ) : (
                                    <h1 className="text-3xl font-display font-bold text-slate-900">{formData.name}</h1>
                                )}
                                <div className="flex gap-2 mt-2 items-center">
                                    <Badge variant={formData.role === "admin" ? "destructive" : formData.role === "technician" ? "default" : "secondary"} className="capitalize">
                                        {formData.role}
                                    </Badge>
                                    <Badge variant={formData.isActive ? "outline" : "secondary"}>
                                        {formData.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <Button variant="outline" onClick={() => {
                                        if (isNew) setLocation("/users");
                                        else {
                                            setIsEditing(false);
                                            if (user) setFormData({ ...user, password: "" });
                                        }
                                    }}>Discard</Button>
                                    <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
                                        <Save className="h-4 w-4" /> Save
                                    </Button>

                                </>
                            ) : (
                                <Button onClick={() => setIsEditing(true)} className="gap-2">
                                    <Pencil className="h-4 w-4" /> Edit
                                </Button>

                            )}
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {/* Username */}
                            <div className="space-y-2">
                                <Label className="text-slate-500">Username</Label>
                                {isEditing ? (
                                    <Input
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="username"
                                    />
                                ) : (
                                    <p className="text-slate-900 font-medium py-2">{formData.username}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label className="text-slate-500">Email</Label>
                                {isEditing ? (
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                ) : (
                                    <p className="text-slate-900 font-medium py-2">{formData.email}</p>
                                )}
                            </div>

                            {/* Password - only show in edit mode */}
                            {isEditing && (
                                <div className="space-y-2">
                                    <Label className="text-slate-500">{isNew ? "Password" : "New Password (leave blank to keep current)"}</Label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={isNew ? "Enter password" : "••••••••"}
                                    />
                                </div>
                            )}

                            {/* Role */}
                            <div className="space-y-2">
                                <Label className="text-slate-500">Role</Label>
                                {isEditing ? (
                                    <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="employee">Employee</SelectItem>
                                            <SelectItem value="technician">Technician</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-slate-900 font-medium py-2 capitalize">{formData.role}</p>
                                )}
                            </div>

                            {/* Maintenance Teams - Only for Technicians */}
                            {formData.role === "technician" && (
                                <div className="space-y-2">
                                    <Label className="text-slate-500">Maintenance Teams</Label>
                                    {isEditing ? (
                                        <MultiSelect
                                            options={teams?.map((t: any) => ({ label: t.name, value: t.id.toString() })) || []}
                                            selected={formData.teamIds?.map((id: number) => id.toString()) || []}
                                            onChange={(selected) => setFormData({ ...formData, teamIds: selected.map(s => parseInt(s)) })}
                                            placeholder="Select Teams"
                                        />
                                    ) : (
                                        <div className="flex flex-wrap gap-1 py-2">
                                            {formData.teamIds && formData.teamIds.length > 0 ? (
                                                formData.teamIds.map((id: number) => {
                                                    const team = teams?.find((t: any) => t.id === id);
                                                    return team ? <Badge key={id} variant="secondary">{team.name}</Badge> : null;
                                                })
                                            ) : (
                                                <span className="text-slate-500 italic">No teams assigned</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}


                            {/* Status */}
                            <div className="space-y-2">
                                <Label className="text-slate-500">Status</Label>
                                {isEditing ? (
                                    <Select
                                        value={formData.isActive ? "active" : "inactive"}
                                        onValueChange={(v) => setFormData({ ...formData, isActive: v === "active" })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-slate-900 font-medium py-2">{formData.isActive ? "Active" : "Inactive"}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </LayoutShell>
    );
}
