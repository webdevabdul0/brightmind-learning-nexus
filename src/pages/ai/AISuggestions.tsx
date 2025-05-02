
import { useState } from 'react';
import { Lightbulb, Send, Sparkles, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  match: number; // percentage match
  category: string;
}

const mockRecommendations: CourseRecommendation[] = [
  {
    id: '1',
    title: 'Physics Fundamentals',
    description: 'Perfect for building a strong foundation in physics concepts before O Level exams.',
    match: 95,
    category: 'Science'
  },
  {
    id: '2',
    title: 'Advanced Mathematics',
    description: 'Covers complex algebra, trigonometry, and calculus topics essential for O Level success.',
    match: 88,
    category: 'Mathematics'
  },
  {
    id: '3',
    title: 'English Literature Mastery',
    description: 'Analyze literary works, improve critical writing, and prepare for English Literature exams.',
    match: 75,
    category: 'Languages'
  }
];

const AISuggestions = () => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your Bright Mind AI assistant. I can help you find courses that match your learning goals and interests. Tell me what subjects you're interested in, what your academic goals are, or ask me for recommendations!",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      content: inputText,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    // Simulate AI response delay
    setTimeout(() => {
      let responseContent = '';
      
      if (inputText.toLowerCase().includes('recommend') || 
          inputText.toLowerCase().includes('suggest') ||
          inputText.toLowerCase().includes('course')) {
        responseContent = "Based on your interests and learning style, I've analyzed our course catalog to find the best matches for you. Here are some courses that might help you achieve your academic goals.";
        setShowRecommendations(true);
      } else {
        responseContent = "I'd be happy to recommend some courses for you. To provide the most relevant suggestions, could you tell me more about your academic goals? What subjects are you particularly interested in, and are there any specific areas where you'd like to improve?";
      }
      
      const aiResponse: Message = {
        id: `${Date.now()}-assistant`,
        content: responseContent,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Chat Section */}
        <div className="lg:w-2/3">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center">
              <Sparkles className="h-8 w-8 mr-2 text-brightmind-purple" />
              AI Course Suggestions
            </h1>
            <p className="text-gray-600">Get personalized course recommendations based on your learning style and goals</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden h-[600px] flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-auto p-4">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar className={`h-8 w-8 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                      {message.role === 'user' ? (
                        <>
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback>U</AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarFallback className="bg-brightmind-purple text-white">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    
                    <div 
                      className={`p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-brightmind-blue text-white rounded-tr-none' 
                          : 'bg-gray-100 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      {message.content}
                      <div 
                        className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="flex">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback className="bg-brightmind-purple text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="p-3 rounded-lg bg-gray-100 text-gray-800 rounded-tl-none flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="p-4 border-t">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="flex space-x-2"
              >
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask about course recommendations..."
                  className="flex-1 resize-none"
                  rows={1}
                />
                <Button type="submit" disabled={!inputText.trim() || isLoading}>
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </form>
              <div className="mt-2 text-xs text-muted-foreground">
                Try asking: "Recommend courses for O level physics" or "I'm struggling with mathematics, what courses can help me?"
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
                Recommended Courses
              </h2>
            </div>
            
            <div className="p-4">
              {!showRecommendations ? (
                <div className="text-center p-6">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Personalized Recommendations</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Chat with our AI assistant to receive tailored course recommendations based on your learning needs.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setInputText("Can you recommend courses for O level preparation?");
                      handleSubmit();
                    }}
                  >
                    Get Recommendations
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockRecommendations.map((course) => (
                    <Card key={course.id} className="border overflow-hidden transition-all hover:shadow-md">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{course.title}</CardTitle>
                            <CardDescription className="text-xs">{course.category}</CardDescription>
                          </div>
                          <Badge 
                            variant={course.match >= 90 ? "default" : "outline"}
                            className={course.match >= 90 ? "bg-green-500" : ""}
                          >
                            {course.match}% Match
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-sm">
                        <p>{course.description}</p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-end">
                        <Button variant="ghost" size="sm">View Details</Button>
                        <Button size="sm" className="ml-2">Enroll</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISuggestions;
