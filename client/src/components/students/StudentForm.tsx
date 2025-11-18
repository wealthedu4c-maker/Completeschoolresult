import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Student } from "@shared/schema";

const studentFormSchema = z.object({
  admissionNumber: z.string().min(1, "Admission number is required").toUpperCase(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  otherNames: z.string().optional(),
  gender: z.enum(["Male", "Female"]),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  class: z.string().min(1, "Class is required"),
  classArm: z.string().optional(),
  parentName: z.string().min(1, "Parent name is required"),
  parentPhone: z.string().min(1, "Parent phone is required"),
  parentEmail: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  student?: Student;
  onSubmit: (data: StudentFormData) => Promise<void>;
  isLoading?: boolean;
}

export function StudentForm({ student, onSubmit, isLoading }: StudentFormProps) {
  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      admissionNumber: student?.admissionNumber || "",
      firstName: student?.firstName || "",
      lastName: student?.lastName || "",
      otherNames: student?.otherNames || "",
      gender: (student?.gender as "Male" | "Female") || "Male",
      dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : "",
      class: student?.class || "",
      classArm: student?.classArm || "",
      parentName: student?.parentName || "",
      parentPhone: student?.parentPhone || "",
      parentEmail: student?.parentEmail || "",
      address: student?.address || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="admissionNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Admission Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="STU2024001" 
                    {...field} 
                    className="uppercase"
                    data-testid="input-admission-number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
        </div>

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
                <FormLabel>Other Names (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Middle name" {...field} data-testid="input-other-names" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-date-of-birth" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="class"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class</FormLabel>
                <FormControl>
                  <Input placeholder="Primary 1, JSS 1, SS 1" {...field} data-testid="input-class" />
                </FormControl>
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

        <div className="grid md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="parentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent/Guardian Name</FormLabel>
                <FormControl>
                  <Input placeholder="Parent name" {...field} data-testid="input-parent-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+234 xxx xxx xxxx" {...field} data-testid="input-parent-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Email (Optional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="parent@email.com" {...field} data-testid="input-parent-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Student address" {...field} data-testid="input-address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
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
