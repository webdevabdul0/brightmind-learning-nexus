
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Course form schema
const courseSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  level: z.string().min(1, { message: "Level is required" }),
  duration: z.string().optional(),
  price: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0)
  ),
  image_url: z.string().optional(),
  video_url: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseFormProps {
  existingCourse?: any;
  onSuccess?: () => void;
}

const CourseForm = ({ existingCourse, onSuccess }: CourseFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Initialize form with existing course data or defaults
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: existingCourse ? {
      title: existingCourse.title,
      description: existingCourse.description,
      category: existingCourse.category,
      level: existingCourse.level || 'beginner',
      duration: existingCourse.duration || '',
      price: existingCourse.price || 0,
      image_url: existingCourse.image_url || '',
      video_url: existingCourse.video_url || ''
    } : {
      title: '',
      description: '',
      category: 'mathematics',
      level: 'beginner',
      duration: '',
      price: 0,
      image_url: '',
      video_url: ''
    }
  });

  const onSubmit = async (data: CourseFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const courseData = {
        ...data,
        instructor_id: user.id,
        title: data.title, // Ensure title is explicitly assigned
        category: data.category, // Ensure category is explicitly assigned
      };
      
      let result;
      
      if (existingCourse) {
        // Update existing course
        result = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', existingCourse.id);
      } else {
        // Insert new course
        result = await supabase
          .from('courses')
          .insert(courseData);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: existingCourse ? "Course updated" : "Course created",
        description: existingCourse 
          ? "Your course has been updated successfully." 
          : "Your new course has been created successfully.",
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/courses');
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
              <FormLabel>Course Title</FormLabel>
              <FormControl>
                <Input placeholder="Introduction to Mathematics" {...field} />
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
                  placeholder="A comprehensive introduction to mathematics fundamentals..." 
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="mathematics">Mathematics</SelectItem>
                    <SelectItem value="physics">Physics</SelectItem>
                    <SelectItem value="chemistry">Chemistry</SelectItem>
                    <SelectItem value="biology">Biology</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="history">History</SelectItem>
                    <SelectItem value="geography">Geography</SelectItem>
                    <SelectItem value="computer_science">Computer Science</SelectItem>
                    <SelectItem value="economics">Economics</SelectItem>
                    <SelectItem value="business">Business Studies</SelectItem>
                    <SelectItem value="olevel">O Level</SelectItem>
                    <SelectItem value="alevel">A Level</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="olevel">O Level</SelectItem>
                    <SelectItem value="alevel">A Level</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (e.g., "8 weeks")</FormLabel>
                <FormControl>
                  <Input placeholder="8 weeks" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (0 for free)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://example.com/image.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="video_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Introduction Video URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://youtube.com/watch?v=..." {...field} />
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
              {existingCourse ? "Updating..." : "Creating..."}
            </>
          ) : (
            existingCourse ? "Update Course" : "Create Course"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default CourseForm;
