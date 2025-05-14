
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface YouTubeLessonProps {
  videoUrl: string;
  title: string;
  description?: string;
}

const YouTubeLesson = ({ videoUrl, title, description }: YouTubeLessonProps) => {
  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };
  
  const videoId = getYouTubeVideoId(videoUrl);
  
  if (!videoId) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-medium mb-2">{title}</h2>
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-md">
            Invalid YouTube URL
          </div>
          {description && <p className="mt-4 text-gray-600 dark:text-gray-300">{description}</p>}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-medium mb-4">{title}</h2>
        <div className="aspect-video w-full mb-4">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-md"
          ></iframe>
        </div>
        {description && <p className="text-gray-600 dark:text-gray-300">{description}</p>}
      </CardContent>
    </Card>
  );
};

export default YouTubeLesson;
