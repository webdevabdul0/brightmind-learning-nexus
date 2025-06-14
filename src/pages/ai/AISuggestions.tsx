import { useState, useRef, useEffect } from 'react';
import { Lightbulb, Send, Sparkles, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import React, { createContext, useContext } from 'react';

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

const SYSTEM_PROMPT = `
You are a helpful AI assistant for an O/A Level learning platform. Your job is to provide information, guidance, and suggestions to students about O and A Levels, including subject choices, exam tips, course recommendations, and academic support. You can answer questions about O/A Level subjects, exam preparation, study strategies, and help students find the right courses or resources for their goals. Be friendly, supportive, and focused on helping students succeed in their O/A Level journey.`;

const API_ENDPOINT = "https://models.github.ai/inference";
const MODEL = "openai/gpt-4.1";
const API_TOKEN = import.meta.env.VITE_GITHUB_API_TOKEN;

// Memory Context for storing chat memory
const MemoryContext = createContext({ memory: [], addToMemory: (entry: any) => {}, clearMemory: () => {} });
export function useMemory() { return useContext(MemoryContext); }

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const [memory, setMemory] = useState<any[]>([]);
  const addToMemory = (entry: any) => setMemory(prev => [...prev, entry]);
  const clearMemory = () => setMemory([]);
  return (
    <MemoryContext.Provider value={{ memory, addToMemory, clearMemory }}>
      {children}
    </MemoryContext.Provider>
  );
}

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
  const [error, setError] = useState<string | null>(null);
  const [typingContent, setTypingContent] = useState<string | null>(null);
  const [fullContent, setFullContent] = useState<string | null>(null);
  const typingInterval = useRef<NodeJS.Timeout | null>(null);
  const { memory, addToMemory, clearMemory } = useMemory();

  useEffect(() => {
    if (fullContent !== null) {
      let i = 0;
      setTypingContent('');
      if (typingInterval.current) clearInterval(typingInterval.current);
      typingInterval.current = setInterval(() => {
        setTypingContent((prev) => {
          const next = fullContent.slice(0, (prev?.length || 0) + 1);
          if (next.length === fullContent.length) {
            if (typingInterval.current) clearInterval(typingInterval.current);
            setFullContent(null);
          }
          return next;
        });
      }, 15);
    }
    return () => {
      if (typingInterval.current) clearInterval(typingInterval.current);
    };
  }, [fullContent]);

  useEffect(() => {
    if (typingContent !== null) {
      setMessages((prev) => {
        const lastIdx = prev.length - 1;
        if (lastIdx < 0 || prev[lastIdx].role !== 'assistant') return prev;
        const updated = [...prev];
        updated[lastIdx] = {
          ...updated[lastIdx],
          content: typingContent,
        };
        return updated;
      });
    }
  }, [typingContent]);

  const handleSubmit = async () => {
    if (!inputText.trim()) return;
    
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      content: inputText,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    addToMemory(userMessage.content);
    setInputText('');
    setIsLoading(true);
    setError(null);
    
    const memoryContext = memory.length > 0 ? `\nPrevious context: ${memory.join('\n')}` : '';
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT + memoryContext },
      ...[...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
    ];

    try {
      const response = await fetch(`${API_ENDPOINT}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify({
          messages: apiMessages,
          temperature: 0.7,
          top_p: 1.0,
          model: MODEL
        })
      });
      const data = await response.json();
      let responseContent = '';
      if (data.choices && data.choices[0]?.message?.content) {
        responseContent = data.choices[0].message.content;
        if (responseContent.toLowerCase().includes('recommend') || responseContent.toLowerCase().includes('suggest')) {
          setShowRecommendations(true);
        }
      } else {
        responseContent = "Sorry, I couldn't get a response from the AI.";
      }
      const aiResponse: Message = {
        id: `${Date.now()}-assistant`,
        content: '',
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setFullContent(responseContent);
      setTypingContent('');
    } catch (err: any) {
      setError("Error contacting AI service.");
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto animate-fade-in min-h-screen flex flex-col">
      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Chat Section */}
        <div className="lg:w-2/3 flex flex-col flex-1">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center">
                <Sparkles className="h-8 w-8 mr-2 text-brightmind-purple" />
                AI Course Suggestions
              </h1>
              <p className="text-gray-600">Get personalized course recommendations based on your learning style and goals</p>
            </div>
            <Button variant="outline" onClick={() => { setMessages([]); clearMemory(); }}>Clear Chat</Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col flex-1 min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 min-h-0">
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
                      {message.role === 'assistant' ? (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      ) : (
                        message.content
                      )}
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

export default function AISuggestionsWithMemory() {
  return (
    <MemoryProvider>
      <AISuggestions />
    </MemoryProvider>
  );
}
