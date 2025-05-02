
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Users, 
  MessageSquare, 
  Send, 
  Hand,
  MoreVertical,
  Share2,
  Download,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ChatMessage {
  id: string;
  sender: string;
  senderRole: 'instructor' | 'student';
  content: string;
  timestamp: Date;
}

const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    sender: 'Dr. Sarah Johnson',
    senderRole: 'instructor',
    content: "Welcome everyone to our physics problem-solving session! Today we'll be focusing on mechanics and Newton's laws.",
    timestamp: new Date(Date.now() - 1200000) // 20 minutes ago
  },
  {
    id: '2',
    sender: 'James Wilson',
    senderRole: 'student',
    content: 'Hi everyone, excited to be here!',
    timestamp: new Date(Date.now() - 1080000) // 18 minutes ago
  },
  {
    id: '3',
    sender: 'Dr. Sarah Johnson',
    senderRole: 'instructor',
    content: "Let's start by reviewing the three laws of motion. Can anyone explain Newton's First Law?",
    timestamp: new Date(Date.now() - 960000) // 16 minutes ago
  },
  {
    id: '4',
    sender: 'Emily Chen',
    senderRole: 'student',
    content: "Newton's First Law states that an object will remain at rest or in uniform motion in a straight line unless acted upon by an external force.",
    timestamp: new Date(Date.now() - 900000) // 15 minutes ago
  },
  {
    id: '5',
    sender: 'Dr. Sarah Johnson',
    senderRole: 'instructor',
    content: "Excellent, Emily! That's exactly right. This principle is also known as the law of inertia.",
    timestamp: new Date(Date.now() - 840000) // 14 minutes ago
  }
];

const mockParticipants = [
  { id: '1', name: 'Dr. Sarah Johnson', role: 'instructor' },
  { id: '2', name: 'James Wilson', role: 'student' },
  { id: '3', name: 'Emily Chen', role: 'student' },
  { id: '4', name: 'Michael Brown', role: 'student' },
  { id: '5', name: 'Sophia Garcia', role: 'student' },
  { id: '6', name: 'David Kim', role: 'student' },
  { id: '7', name: 'Olivia Smith', role: 'student' },
  { id: '8', name: 'William Johnson', role: 'student' }
];

const LiveSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [messageInput, setMessageInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom of the chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  const sendMessage = () => {
    if (!messageInput.trim()) return;
    
    const newMessage: ChatMessage = {
      id: `${Date.now()}`,
      sender: 'You',
      senderRole: 'student',
      content: messageInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setMessageInput('');
  };
  
  return (
    <div className="container mx-auto h-[calc(100vh-3rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Link to="/live-classes" className="mr-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Physics Problem Solving Session</h1>
            <div className="text-muted-foreground">Dr. Sarah Johnson • Ongoing</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Session Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download Materials
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
          {/* Main presenter video */}
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="text-center text-white">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white/20">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="text-2xl">SJ</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">Dr. Sarah Johnson</h2>
              <p className="text-white/70">Physics Instructor</p>
            </div>
          </div>
          
          {/* Participant thumbnails */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 w-28 bg-gray-700 rounded flex items-center justify-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>
                    {mockParticipants[i].name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
            ))}
          </div>
          
          {/* Controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
              <Button 
                variant={isHandRaised ? "default" : "ghost"}
                size="icon"
                className={`rounded-full ${isHandRaised ? 'bg-brightmind-purple hover:bg-brightmind-darkpurple' : 'bg-white/10 hover:bg-white/20'} text-white`}
                onClick={() => setIsHandRaised(!isHandRaised)}
              >
                <Hand className="h-5 w-5" />
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                className="rounded-full"
              >
                Leave Session
              </Button>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="w-80 bg-white rounded-lg shadow overflow-hidden border flex flex-col">
          <Tabs defaultValue="chat" className="flex flex-col h-full">
            <TabsList className="w-full">
              <TabsTrigger value="chat" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="participants" className="flex-1">
                <Users className="h-4 w-4 mr-2" />
                Participants ({mockParticipants.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 flex flex-col p-0 overflow-hidden">
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {chatMessages.map(message => (
                  <div key={message.id} className="mb-4">
                    <div className="flex items-start gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback className={message.senderRole === 'instructor' ? 'bg-brightmind-purple text-white' : ''}>
                          {message.sender.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{message.sender}</span>
                          {message.senderRole === 'instructor' && (
                            <span className="text-xs bg-brightmind-purple/10 text-brightmind-purple px-2 py-0.5 rounded-full">
                              Instructor
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              
              {/* Message input */}
              <div className="p-4 border-t">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </TabsContent>
            
            <TabsContent value="participants" className="flex-1 p-0 overflow-hidden">
              <div className="h-full overflow-y-auto p-4">
                <div className="space-y-1 mb-4">
                  <h3 className="font-medium text-sm text-muted-foreground">Instructor</h3>
                  {mockParticipants
                    .filter(p => p.role === 'instructor')
                    .map(participant => (
                      <div key={participant.id} className="flex items-center justify-between p-2 hover:bg-muted/20 rounded-md">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-brightmind-purple text-white">
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{participant.name}</span>
                        </div>
                      </div>
                    ))}
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-muted-foreground">Students ({mockParticipants.filter(p => p.role === 'student').length})</h3>
                  {mockParticipants
                    .filter(p => p.role === 'student')
                    .map(participant => (
                      <div key={participant.id} className="flex items-center justify-between p-2 hover:bg-muted/20 rounded-md">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>
                              {participant.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{participant.name}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LiveSession;
