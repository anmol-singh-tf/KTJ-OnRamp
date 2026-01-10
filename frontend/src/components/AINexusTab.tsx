import { useState, useRef, useEffect } from "react";
import { Send, Plane, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  autoFill?: {
    receiver: string;
    amount: number;
  };
}

interface AINexusTabProps {
  onAutoFill: (receiver: string, amount: string) => void;
}

const AINexusTab = ({ onAutoFill }: AINexusTabProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "agent",
      content: "Where would you like to fly today? Or who do you need to pay?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE_URL}/agent/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) throw new Error("Agent failed to respond");

      const data = await response.json();

      const agentResponse: Message = {
        id: Date.now().toString(),
        role: "agent",
        content: data.text || "Sorry, I didn't catch that.",
        autoFill: data.auto_fill ? {
          receiver: data.auto_fill.receiver,
          amount: parseFloat(data.auto_fill.amount)
        } : undefined,
      };

      setMessages((prev) => [...prev, agentResponse]);

      // Handle auto-fill
      if (agentResponse.autoFill) {
        onAutoFill(
          agentResponse.autoFill.receiver,
          agentResponse.autoFill.amount.toString()
        );
      }
    } catch (error) {
      console.error("Agent Error:", error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "agent",
        content: "Sorry, I'm having trouble connecting to the brain. Is the backend running?",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <span className="text-lg">✨</span>
          AI Nexus
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Speak your intent, I'll handle the rest
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "animate-fade-in",
              message.role === "user" ? "flex justify-end" : "flex justify-start"
            )}
          >
            <div
              className={cn(
                message.role === "user" ? "chat-bubble-user" : "chat-bubble-agent"
              )}
            >
              <p className="text-sm text-foreground">{message.content}</p>

              {/* Transaction Proposal Card */}
              {message.autoFill && (
                <div className="tx-proposal mt-3">
                  <div className="flex items-center gap-2 text-xs text-primary font-medium mb-2">
                    <Plane className="w-4 h-4" />
                    Transaction Proposal
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">To:</span>
                      <span className="text-foreground font-mono truncate max-w-[150px]">
                        {message.autoFill.receiver}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="text-foreground font-semibold">
                        {message.autoFill.amount} ETH
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                    <Wallet className="w-4 h-4 text-success" />
                    <span className="text-xs text-success">
                      Ready for biometric confirmation
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="chat-bubble-agent">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-xs text-muted-foreground">Agent thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your request..."
            disabled={isLoading}
            className="input-glow flex-1 text-foreground placeholder:text-muted-foreground/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="btn-gradient px-4 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AINexusTab;
