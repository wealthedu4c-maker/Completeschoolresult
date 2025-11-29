import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";
import type { School } from "@shared/schema";
import { useState } from "react";

const createSchoolSchema = z.object({
  name: z.string().min(1, "School name is required"),
  code: z.string().optional(),
  email: z.string().email("Invalid email address"),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(30, "Subdomain must be at most 30 characters")
    .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  logo: z.string().optional(),
  initialPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.initialPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const editSchoolSchema = z.object({
  name: z.string().min(1, "School name is required"),
  code: z.string().optional(),
  email: z.string().email("Invalid email address"),
  subdomain: z.string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(30, "Subdomain must be at most 30 characters")
    .regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
  logo: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  motto: z.string().optional(),
});

type CreateSchoolFormData = z.infer<typeof createSchoolSchema>;
type EditSchoolFormData = z.infer<typeof editSchoolSchema>;

interface SchoolFormProps {
  school?: School;
  onSubmit: (data: CreateSchoolFormData | EditSchoolFormData) => Promise<void>;
  isLoading?: boolean;
}

export function SchoolForm({ school, onSubmit, isLoading }: SchoolFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isEditing = !!school;

  const form = useForm<CreateSchoolFormData | EditSchoolFormData>({
    resolver: zodResolver(isEditing ? editSchoolSchema : createSchoolSchema),
    defaultValues: isEditing ? {
      name: school.name || "",
      code: school.code || "",
      email: school.email || "",
      subdomain: school.subdomain || "",
      logo: school.logo || "",
      address: school.address || "",
      city: school.city || "",
      state: school.state || "",
      country: school.country || "",
      phone: school.phone || "",
      motto: school.motto || "",
    } : {
      name: "",
      code: "",
      email: "",
      subdomain: "",
      logo: "",
      initialPassword: "",
      confirmPassword: "",
    },
  });

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 30);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>School Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Example High School" 
                  {...field} 
                  onChange={(e) => {
                    field.onChange(e);
                    if (!isEditing && !form.getValues("subdomain")) {
                      form.setValue("subdomain", generateSubdomain(e.target.value));
                    }
                  }}
                  data-testid="input-name" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School Code (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="EHS001" 
                    {...field} 
                    className="uppercase"
                    data-testid="input-code"
                  />
                </FormControl>
                <FormDescription>Auto-generated if left empty</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Admin Email Address</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="admin@school.com" 
                    {...field} 
                    data-testid="input-email"
                  />
                </FormControl>
                <FormDescription>Used for school admin login</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subdomain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subdomain</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="example-school" 
                    {...field} 
                    className="lowercase"
                    data-testid="input-subdomain"
                  />
                  <span className="text-muted-foreground whitespace-nowrap">.smartresult.app</span>
                </div>
              </FormControl>
              <FormDescription>School's unique URL identifier</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/logo.png" 
                  {...field} 
                  data-testid="input-logo"
                />
              </FormControl>
              <FormDescription>School logo image URL</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditing && (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="initialPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 8 characters" 
                          {...field} 
                          data-testid="input-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>Password for school admin account</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Re-enter password" 
                          {...field} 
                          data-testid="input-confirm-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {isEditing && (
          <>
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Additional Information</h4>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="School address" {...field} data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-3 gap-4 mb-4">
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
                        <Input placeholder="+234 xxx xxx xxxx" {...field} data-testid="input-phone" />
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
                      <FormLabel>School Motto</FormLabel>
                      <FormControl>
                        <Input placeholder="Excellence in Education" {...field} data-testid="input-motto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            data-testid="button-submit"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditing ? "Update School" : "Create School"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
