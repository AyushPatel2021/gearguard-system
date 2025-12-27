import { useState } from "react";
import { useTeams } from "@/hooks/use-gear";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Plus, Users, Briefcase } from "lucide-react";
import { useLocation } from "wouter";

export default function TeamsPage() {
    const { data: teams, isLoading } = useTeams();
    const [searchTerm, setSearchTerm] = useState("");
    const [, setLocation] = useLocation();

    const filteredTeams = teams?.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <LayoutShell>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">Maintenance Teams</h1>
                    <p className="text-muted-foreground mt-1">Manage maintenance teams and specializations.</p>
                </div>
                <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setLocation("/teams/new")}>
                    <Plus className="h-4 w-4" />
                    Add Team
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search teams..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Specialization</TableHead>
                                <TableHead>Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">Loading teams...</TableCell>
                                </TableRow>
                            ) : filteredTeams?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        No teams found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTeams?.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="hover:bg-slate-50/50 cursor-pointer"
                                        onClick={() => setLocation(`/teams/${item.id}`)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <Users className="h-4 w-4" />
                                                </div>
                                                {item.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="h-3 w-3 text-muted-foreground" />
                                                {item.specialization || "General"}
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.description || "-"}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </LayoutShell>
    );
}
