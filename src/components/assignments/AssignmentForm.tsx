
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

// Assignment form schema
const assignmentSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  due_date: z.string().min(1, { message: "Due date is required" }),
  points: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0)
  ),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface AssignmentFormProps {
  courseId: string;
  existingAssignment?: any;
  onSuccess?: () => void;
}

const AssignmentForm = ({ courseId, existingAssignment, onSuccess }: AssignmentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Initialize form with existing assignment data or defaults
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: existingAssignment ? {
      title: existingAssignment.title,
      description: existingAssignment.description || '',
      due_date: existingAssignment.due_date ? new Date(existingAssignment.due_date).toISOString().split('T')[0] : '',
      points: existingAssignment.points || 0
    } : {
      title: '',
      description: '',
      due_date: '',
      points: 100
    }
  });

  const onSubmit = async (data: AssignmentFormValues) => {
    setIsSubmitting(true);
    
    try {
      const assignmentData = {
        ...data,
        course_id: courseId
      };
      
      let result;
      
      if (existingAssignment) {
        // Update existing assignment
        result = await supabase
          .from('assignments')
          .update(assignmentData)
          .eq('id', existingAssignment.id);
      } else {
        // Insert new assignment
        result = await supabase
          .from('assignments')
          .insert(assignmentData);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: existingAssignment ? "Assignment updated" : "Assignment created",
        description: existingAssignment 
          ? "Your assignment has been updated successfully." 
          : "Your new assignment has been created successfully.",
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/assignments');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assignment Title</FormLabel>
              <FormControl>
                <Input placeholder="Calculus Fundamentals Quiz" {...field} />
              </FormControl>
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
                  placeholder="Complete the exercises on differential calculus..." 
                  className="min-h-[120px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="points"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {existingAssignment ? "Updating..." : "Creating..."}
            </>
          ) : (
            existingAssignment ? "Update Assignment" : "Create Assignment"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AssignmentForm;
