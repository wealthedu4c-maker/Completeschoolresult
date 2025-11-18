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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { School } from "@shared/schema";

const schoolFormSchema = z.object({
  name: z.string().min(1, "School name is required"),
  code: z.string().min(1, "School code is required").toUpperCase(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().default("Nigeria"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address"),
  logo: z.string().optional(),
  motto: z.string().optional(),
});

type SchoolFormData = z.infer<typeof schoolFormSchema>;

interface SchoolFormProps {
  school?: School;
  onSubmit: (data: SchoolFormData) => Promise<void>;
  isLoading?: boolean;
}

export function SchoolForm({ school, onSubmit, isLoading }: SchoolFormProps) {
  const form = useForm<SchoolFormData>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      name: school?.name || "",
      code: school?.code || "",
      address: school?.address || "",
      city: school?.city || "",
      state: school?.state || "",
      country: school?.country || "Nigeria",
      phone: school?.phone || "",
      email: school?.email || "",
      logo: school?.logo || "",
      motto: school?.motto || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School Name</FormLabel>
                <FormControl>
                  <Input placeholder="Example High School" {...field} data-testid="input-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="EHS001" 
                    {...field} 
                    className="uppercase"
                    data-testid="input-code"
                  />
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
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter school address" 
                  {...field} 
                  data-testid="input-address"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Lagos" {...field} data-testid="input-city" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="Lagos" {...field} data-testid="input-state" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Nigeria" {...field} data-testid="input-country" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+234 xxx xxx xxxx" 
                    {...field} 
                    data-testid="input-phone"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="info@school.com" 
                    {...field} 
                    data-testid="input-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo URL (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://..." 
                    {...field} 
                    data-testid="input-logo"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="motto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School Motto (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Excellence in Education" 
                    {...field} 
                    data-testid="input-motto"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
              school ? "Update School" : "Create School"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
