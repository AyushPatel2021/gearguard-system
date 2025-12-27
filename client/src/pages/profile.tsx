import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { User, Mail, Shield, Camera, Key, Upload } from "lucide-react";

import { api } from "@shared/routes";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        avatarUrl: user?.avatarUrl || "",
        password: "",
        confirmPassword: "",
        currentPassword: ""
    });

    const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 500;
                    const MAX_HEIGHT = 500;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const resizedImage = await resizeImage(file);
                setFormData(prev => ({ ...prev, avatarUrl: resizedImage }));
            } catch (error) {
                toast({ title: "Error", description: "Failed to process image", variant: "destructive" });
            }
        }
    };


    const updateProfileMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/users/${user?.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to update profile");
            }
            return res.json();
        },
        onSuccess: (updatedUser) => {
            queryClient.setQueryData([api.auth.me.path], updatedUser);
            // Also invalidate explicit user fetch if any
            queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] });

            toast({ title: "Profile Updated", description: "Your changes have been saved." });
            setIsEditing(false);
            toast({ title: "Profile Updated", description: "Your changes have been saved." });
            setIsEditing(false);
            setFormData(prev => ({ ...prev, password: "", confirmPassword: "", currentPassword: "" }));

        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    });

    const handleSave = () => {
        if (formData.password && formData.password !== formData.confirmPassword) {
            toast({
                title: "Password Mismatch",
                description: "New password and confirm password do not match.",
                variant: "destructive"
            });
            return;
        }



        if (formData.password && !formData.currentPassword) {
            toast({
                title: "Current Password Required",
                description: "Please enter your current password to set a new one.",
                variant: "destructive"
            });
            return;
        }

        const payload: any = {
            name: formData.name,
            avatarUrl: formData.avatarUrl,
        };

        if (formData.password) {
            payload.password = formData.password;
            payload.currentPassword = formData.currentPassword;
        }

        updateProfileMutation.mutate(payload);

    };

    if (!user) return <></>;

    return (
        <LayoutShell>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-display font-bold text-slate-900">My Profile</h1>
                    {!isEditing && (
                        <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Avatar & Basic Info */}
                    <Card className="md:col-span-1 border-slate-200 shadow-sm h-fit">
                        <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
                            <div className="relative group">
                                <Avatar className="w-32 h-32 border-4 border-slate-50 shadow-xl">
                                    <AvatarImage src={formData.avatarUrl || user.avatarUrl || ""} />
                                    <AvatarFallback className="text-4xl bg-slate-200 text-slate-500">
                                        {user.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                                <p className="text-sm text-slate-500 capitalize">{user.role}</p>
                            </div>

                            <Separator />

                            <div className="w-full text-left space-y-3 pt-2">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span className="truncate">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Shield className="w-4 h-4 text-slate-400" />
                                    <span className="capitalize">{user.role} Access</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right Column: Edit Form */}
                    <Card className="md:col-span-2 border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                            <CardDescription>Manage your personal information and security settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        disabled={!isEditing}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="max-w-md"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Username</Label>
                                    <Input
                                        disabled
                                        value={user.username}
                                        className="max-w-md bg-slate-50"
                                    />
                                    <p className="text-[0.8rem] text-slate-500">Username cannot be changed.</p>
                                </div>

                                {isEditing && (
                                    <div className="grid gap-2">
                                        <Label>Avatar Image</Label>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex gap-2 max-w-md items-center">
                                                {formData.avatarUrl && (
                                                    <div className="w-16 h-16 rounded-md border overflow-hidden shrink-0 relative group">
                                                        <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <Label htmlFor="avatar-upload" className="cursor-pointer">
                                                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-slate-50 transition-colors">
                                                        <Upload className="w-4 h-4" />
                                                        <span>Upload Photo</span>
                                                    </div>
                                                    <Input
                                                        id="avatar-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                    />
                                                </Label>
                                                <div className="text-xs text-muted-foreground">
                                                    Or paste URL below
                                                </div>
                                            </div>
                                            <Input
                                                value={formData.avatarUrl}
                                                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                                                placeholder="https://example.com/avatar.jpg"
                                                className="max-w-md"
                                            />
                                        </div>
                                    </div>

                                )}
                            </div>

                            {isEditing && (
                                <>
                                    <Separator />

                                    <div className="space-y-4">
                                        <h3 className="font-medium flex items-center gap-2">
                                            <Key className="w-4 h-4" /> Change Password
                                        </h3>
                                        <div className="grid gap-4 max-w-md">
                                            <div className="grid gap-2">
                                                <Label>Current Password <span className="text-red-500">*</span></Label>
                                                <Input
                                                    type="password"
                                                    placeholder="Required to change password"
                                                    value={formData.currentPassword}
                                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                                    className="border-slate-300"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>New Password</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="Leave blank to keep current"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Confirm New Password</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="Confirm new password"
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button variant="outline" onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                name: user.name,
                                                avatarUrl: user.avatarUrl || "",
                                                password: "",
                                                confirmPassword: "",
                                                currentPassword: ""
                                            });

                                        }}>Cancel</Button>
                                        <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
                                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </LayoutShell>
    );
}
