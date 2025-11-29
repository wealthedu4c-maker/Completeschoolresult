import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Student, Class } from "@shared/schema";

const studentFormSchema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required").toUpperCase(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  otherNames: z.string().optional(),
  gender: z.enum(["Male", "Female"]),
  class: z.string().min(1, "Class is required"),
  classArm: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  student?: Student;
  onSubmit: (data: StudentFormData) => Promise<void>;
  isLoading?: boolean;
}

function generateAdmissionNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `STU${year}${random}`;
}

export function StudentForm({ student, onSubmit, isLoading }: StudentFormProps) {
  const [autoGenerate, setAutoGenerate] = useState(!student);

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      admissionNumber: student?.admissionNumber || (autoGenerate ? generateAdmissionNumber() : ""),
      firstName: student?.firstName || "",
      lastName: student?.lastName || "",
      otherNames: student?.otherNames || "",
      gender: (student?.gender as "Male" | "Female") || "Male",
      class: student?.class || "",
      classArm: student?.classArm || "",
    },
  });

  const handleAutoGenerateToggle = (checked: boolean) => {
    setAutoGenerate(checked);
    if (checked) {
      form.setValue("admissionNumber", generateAdmissionNumber());
    } else {
      form.setValue("admissionNumber", "");
    }
  };

  const regenerateAdmissionNumber = () => {
    form.setValue("admissionNumber", generateAdmissionNumber());
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-generate" className="text-sm font-medium">
              Auto-generate Admission Number
            </Label>
            <Switch
              id="auto-generate"
              checked={autoGenerate}
              onCheckedChange={handleAutoGenerateToggle}
              disabled={!!student}
              data-testid="switch-auto-generate"
            />
          </div>
          
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="admissionNumber"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Admission Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="STU2024001" 
                      {...field} 
                      className="uppercase"
                      disabled={autoGenerate && !student}
                      data-testid="input-admission-number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {autoGenerate && !student && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="mt-8"
                onClick={regenerateAdmissionNumber}
                title="Generate new number"
                data-testid="button-regenerate"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} data-testid="input-first-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} data-testid="input-last-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="otherNames"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Middle Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Middle name" {...field} data-testid="input-other-names" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="class"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class</FormLabel>
                {classes.length > 0 ? (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-class">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.name}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input placeholder="Primary 1, JSS 1, SS 1" {...field} data-testid="input-class" />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="classArm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Arm (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="A, B, C" {...field} data-testid="input-class-arm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            data-testid="button-submit"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              student ? "Update Student" : "Add Student"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
