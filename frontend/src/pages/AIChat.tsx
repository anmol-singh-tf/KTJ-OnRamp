import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User,
  Sparkles,
  Plane,
  MapPin,
  Calendar,
  Loader2
} from 'lucide-react';
import { useChatStore, ChatMessage } from '@/stores/chatStore';
import { useFingerprintStore } from '@/stores/fingerprintStore';
import { Input } from '@/components/ui/input';

const AI_WELCOME_MESSAGE = (name: string) => 
  `Hello! I'm NexPay AI 🤖\n\nI'm here to help you with:\n\n✈️ **Travel Planning** - Find the best destinations\n🎫 **Flight Bookings** - Compare and book flights\n🏪 **Merchant Discovery** - Find businesses that accept NexPay\n💡 **Payment Tips** - Get the most out of international transfers\n\nWhat can I help you with today, ${name}?`;

const AIChat: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, addMessage, setLoading } = useChatStore();
  const { userName } = useFingerprintStore();

  // Add welcome message on mount if no messages
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        role: 'assistant',
        content: AI_WELCOME_MESSAGE(userName || 'there'),
      });
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    addMessage({
      role: 'user',
      content: userMessage,
    });

    setLoading(true);

    try {
      // Simulate AI API call
      // In production, this would call your AI server
      console.log('Sending to AI server:', { message: userMessage });
      
      
      // INSERT_YOUR_CODE
      // Call backend /agent/chat API for AI response
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage, userName }),
      });
      if (!response.ok) throw new Error('Failed to get response from AI server');
      const data = await response.json();
      console.log('###Data:', data);

      addMessage({
        role: 'assistant',
        content: data.text || 'Sorry, I could not generate a reply this time.',
      });

      // Simulate AI response based on keywords
      let aiResponse = '';
      const lowerMessage = userMessage.toLowerCase();

      if (lowerMessage.includes('travel') || lowerMessage.includes('trip') || lowerMessage.includes('vacation')) {
        aiResponse = `Great choice! 🌍 Here are some amazing destinations for you:\n\n**Top Picks:**\n• 🇯🇵 Tokyo, Japan - Perfect blend of tradition and technology\n• 🇮🇹 Rome, Italy - Rich history and incredible food\n• 🇹🇭 Bangkok, Thailand - Budget-friendly luxury\n\nWould you like me to help you plan a trip to any of these destinations? I can also search for flights and accommodations!`;
      } else if (lowerMessage.includes('flight') || lowerMessage.includes('book')) {
        aiResponse = `✈️ I'd be happy to help you find flights!\n\nTo search for the best options, I'll need:\n• **From:** Your departure city\n• **To:** Destination city\n• **Dates:** When you want to travel\n• **Passengers:** How many travelers\n\nJust share these details and I'll find the best deals for you!`;
      } else if (lowerMessage.includes('merchant') || lowerMessage.includes('business') || lowerMessage.includes('shop')) {
        aiResponse = `🏪 Here are some popular NexPay merchants:\n\n**Travel & Transport:**\n• SkyWings Airlines ✈️\n• GlobalCab Services 🚕\n• TrainEurope 🚄\n\n**Food & Dining:**\n• WorldBite Restaurants 🍜\n• CafeChain International ☕\n\n**Shopping:**\n• TechWorld Electronics 📱\n• FashionGlobal 👗\n\nAll accept NexPay with 0% transaction fees!`;
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        aiResponse = `Hello ${userName || 'there'}! 👋\n\nI'm ready to help you with your travel plans and more. What would you like to explore today?\n\n• Plan a trip ✈️\n• Find flights 🎫\n• Discover merchants 🏪`;
      } else {
        aiResponse = `Thanks for your message! 😊\n\nI specialize in:\n• **Travel Planning** - Destinations, itineraries, tips\n• **Flight Bookings** - Finding the best deals\n• **Merchant Discovery** - NexPay-accepting businesses\n\nFeel free to ask me anything about these topics!`;
      }

      addMessage({
        role: 'assistant',
        content: aiResponse,
      });
    } catch (error) {
      console.error('AI chat error:', error);
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { icon: Plane, label: 'Plan Trip', message: 'Help me plan a trip' },
    { icon: MapPin, label: 'Merchants', message: 'Show me NexPay merchants' },
    { icon: Calendar, label: 'Flights', message: 'Help me find flights' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-primary glow">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">NexPay AI</h2>
            <p className="text-xs text-muted-foreground">Your travel & payment assistant</p>
          </div>
          <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-success/10 rounded-full">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success font-medium">Online</span>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <div className="p-2 rounded-xl bg-gradient-primary">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="glass rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pb-4"
        >
          <p className="text-xs text-muted-foreground mb-2">Quick actions</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {quickActions.map((action) => (
              <motion.button
                key={action.label}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setInputValue(action.message);
                  handleSend();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-full whitespace-nowrap transition-colors"
              >
                <action.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Input */}
      <div className="p-4 glass border-t border-border mb-20">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            className="flex-1 bg-secondary/50 border-0"
            disabled={isLoading}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="p-3 rounded-xl bg-gradient-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`p-2 rounded-xl ${isUser ? 'bg-primary' : 'bg-gradient-primary'}`}>
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        )}
      </div>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-none'
            : 'glass rounded-tl-none'
        }`}
      >
        <div className={`text-sm whitespace-pre-wrap ${isUser ? '' : 'text-foreground'}`}>
          {message.content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line.startsWith('**') && line.endsWith('**') ? (
                <strong>{line.slice(2, -2)}</strong>
              ) : line.startsWith('• ') ? (
                <span className="block ml-2">{line}</span>
              ) : (
                line
              )}
              {i < message.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>
  
    </motion.div>


  );
};

export default AIChat;
