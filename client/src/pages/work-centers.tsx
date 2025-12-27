import { useState } from "react";
import { useWorkCenters } from "@/hooks/use-gear";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Search, Filter, Factory, ChevronRight } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

export default function WorkCentersPage() {
    const { data: workCenters, isLoading } = useWorkCenters();
    const [, setLocation] = useLocation();

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const filteredWorkCenters = workCenters?.filter(wc => {
        const matchesSearch = wc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wc.code.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filtering can be added if status is exposed in UI, for now assume active
        const matchesFilter = filterStatus === "all" ? true : wc.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    return (
        <LayoutShell>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900">Work Centers</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage work centers, capacity, and efficiency targets.
                    </p>
                </div>

                <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setLocation("/work-centers/new")}>
                    <Plus className="h-4 w-4" />
                    Add Work Center
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search work centers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Filter className="h-4 w-4" />
                                Filters
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={filterStatus === "all"} onCheckedChange={() => setFilterStatus("all")}>
                                All
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={filterStatus === "active"} onCheckedChange={() => setFilterStatus("active")}>
                                Active
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={filterStatus === "inactive"} onCheckedChange={() => setFilterStatus("inactive")}>
                                Inactive
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Work Center</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Tag</TableHead>
                                <TableHead>Alternative WCs</TableHead>
                                <TableHead className="text-right">Cost per hour</TableHead>
                                <TableHead className="text-right">Capacity</TableHead>
                                <TableHead className="text-right">Efficiency</TableHead>
                                <TableHead className="text-right">OEE Target</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : filteredWorkCenters?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                        No work centers found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredWorkCenters?.map((wc) => (
                                    <TableRow
                                        key={wc.id}
                                        className="hover:bg-slate-50/50 cursor-pointer"
                                        onClick={() => setLocation(`/work-centers/${wc.id}`)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                                    <Factory className="h-4 w-4" />
                                                </div>
                                                {wc.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">{wc.code}</TableCell>
                                        <TableCell>
                                            {wc.tag && <Badge variant="outline">{wc.tag}</Badge>}
                                        </TableCell>
                                        <TableCell>
                                            {Array.isArray(wc.alternativeWorkCenters) && wc.alternativeWorkCenters.length > 0
                                                ? (wc.alternativeWorkCenters as string[]).join(", ")
                                                : <span className="text-muted-foreground">-</span>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(wc.costPerHour || 0)}
                                        </TableCell>
                                        <TableCell className="text-right">{wc.capacity}</TableCell>
                                        <TableCell className="text-right">{wc.timeEfficiency}%</TableCell>
                                        <TableCell className="text-right">{wc.oeeTarget}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setLocation(`/work-centers/${wc.id}`); }}>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </LayoutShell >
    );
}



