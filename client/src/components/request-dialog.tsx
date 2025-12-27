import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRequestSchema } from "@shared/schema";
import { useCreateRequest, useEquipment, useUsers, useWorkCenters } from "@/hooks/use-gear";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const formSchema = insertRequestSchema.extend({
  equipmentId: z.coerce.number().optional(),
  workCenterId: z.coerce.number().optional(),
  maintenanceFor: z.enum(["equipment", "work_center"]).default("equipment"),
  priority: z.enum(["low", "medium", "high"]),
  requestType: z.enum(["corrective", "preventive"]),
  technicianIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RequestDialogProps {
  preselectedEquipmentId?: number;
  trigger?: React.ReactNode;
}

export function RequestDialog({ preselectedEquipmentId, trigger }: RequestDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const createRequest = useCreateRequest();
  const { data: equipmentList } = useEquipment();
  const { data: workCenters } = useWorkCenters();
  const { data: users } = useUsers();

  const technicians = users?.filter((u: any) => u.role === 'technician') || [];
  const technicianOptions = technicians.map((t: any) => ({ label: t.name, value: t.id.toString() }));

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      description: "",
      priority: "medium",
      requestType: "corrective",
      status: "new",
      equipmentId: preselectedEquipmentId,
      workCenterId: undefined,
      maintenanceFor: "equipment",
      createdBy: user?.id,
      technicianIds: [],
    },
  });

  const onSubmit = (data: FormValues) => {
    // Determine the maintenance team from the selected equipment
    // Note: If maintenanceFor is work_center, we might need logic for team, but for now fallback to null
    let maintenanceTeamId = null;
    if (data.maintenanceFor === 'equipment' && data.equipmentId) {
      const selectedEq = equipmentList?.find(e => e.id === data.equipmentId);
      maintenanceTeamId = selectedEq?.maintenanceTeamId || null;
    }

    const payload: any = {
      ...data,
      maintenanceTeamId,
      createdBy: user?.id!,
      status: "new",
    };

    createRequest.mutate(payload, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Maintenance Request</DialogTitle>
          <DialogDescription>
            Submit a new ticket for equipment repair or inspection.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Conveyor Belt Noise" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maintenanceFor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance For</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="work_center">Work Center</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("maintenanceFor") === "equipment" ? (
                <FormField
                  control={form.control}
                  name="equipmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipment</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                        disabled={!!preselectedEquipmentId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select equipment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {equipmentList?.map((eq) => (
                            <SelectItem key={eq.id} value={eq.id.toString()}>
                              {eq.name} ({eq.serialNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="workCenterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Center</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select work center" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workCenters?.map((wc) => (
                            <SelectItem key={wc.id} value={wc.id.toString()}>
                              {wc.name} ({wc.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}


              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="technicianIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Technicians</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={technicianOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select technicians..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="corrective">Corrective Repair</SelectItem>
                      <SelectItem value="preventive">Preventive Check</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue in detail..."
                      className="resize-none h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={createRequest.isPending}>
                {createRequest.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
