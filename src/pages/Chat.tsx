import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, Bot, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Check daily limit for free users
    if (profile?.role === "free" && profile?.daily_usage_count >= 15) {
      toast({
        variant: "destructive",
        title: "Daily limit reached",
        description: "Upgrade to Pro for unlimited messages!",
      });
      navigate("/subscription");
      return;
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Call AI chat edge function
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [...messages, userMessage]
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update usage count
      if (profile?.role === "free") {
        await supabase
          .from("profiles")
          .update({ daily_usage_count: (profile.daily_usage_count || 0) + 1 })
          .eq("id", profile.id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get AI response",
      });
    } finally {
      setLoading(false);
    }
  };

  const remainingMessages = profile?.role === "pro" ? "Unlimited" : Math.max(0, 15 - (profile?.daily_usage_count || 0));

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <Navigation isAuthenticated={true} />

      <div className="container mx-auto px-4 pt-24 pb-6 h-screen flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold gradient-text">AI Chat</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30">
              {profile?.daily_usage_count || 0} / {remainingMessages} messages
            </Badge>
            {profile?.role === "free" && (
              <Button
                onClick={() => navigate("/subscription")}
                size="sm"
                className="bg-gradient-accent text-accent-foreground glow-accent"
              >
                Upgrade
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center animate-slide-up">
                <div className="mb-4 inline-block p-4 rounded-2xl bg-gradient-primary glow-primary">
                  <Sparkles className="w-12 h-12 text-primary-foreground animate-float" />
                </div>
                <h2 className="text-2xl font-bold gradient-text mb-2">
                  Welcome to AI Fusion Chat
                </h2>
                <p className="text-muted-foreground mb-4">
                  Ask anything and get instant AI-powered responses
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } animate-slide-up`}
              >
                <Card
                  className={`max-w-[80%] p-4 ${
                    message.role === "user"
                      ? "bg-gradient-primary text-primary-foreground glow-primary"
                      : "bg-card/80 backdrop-blur border-primary/20 glow-primary"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === "assistant" ? (
                      <Bot className="w-5 h-5 mt-1 text-primary" />
                    ) : (
                      <UserIcon className="w-5 h-5 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything..."
            className="min-h-[60px] border-primary/30 focus:border-primary bg-background/50 resize-none"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-gradient-primary text-primary-foreground glow-primary hover:opacity-90 h-[60px] px-6"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;