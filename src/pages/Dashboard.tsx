import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Image, Sparkles, Crown, History, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      setProfile(profileData);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background cyber-grid flex items-center justify-center">
        <div className="animate-glow-pulse">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  const remainingMessages = profile?.role === "pro" ? "Unlimited" : Math.max(0, 15 - (profile?.daily_usage_count || 0));
  const remainingImages = Math.max(0, 5 - (profile?.image_generation_count || 0));

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <Navigation isAuthenticated={true} />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Your AI command center awaits.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20 bg-card/80 backdrop-blur glow-primary hover:scale-105 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Messages Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold gradient-text">{profile?.daily_usage_count || 0} / {remainingMessages}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {profile?.role === "pro" ? "Pro user - unlimited access" : "Free tier"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-card/80 backdrop-blur glow-secondary hover:scale-105 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-secondary" />
                Image Generations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">{profile?.image_generation_count || 0} / {remainingImages}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {profile?.role === "free" ? "5 free generations" : "Unlimited"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-card/80 backdrop-blur glow-accent hover:scale-105 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-accent" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-accent capitalize">{profile?.role || "Free"}</p>
              {profile?.role === "free" && (
                <Button
                  onClick={() => navigate("/subscription")}
                  size="sm"
                  className="mt-2 bg-gradient-accent text-accent-foreground glow-accent"
                >
                  Upgrade Now
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-primary/20 bg-card/80 backdrop-blur hover:border-primary transition-all group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary group-hover:animate-float" />
                Start Chatting
              </CardTitle>
              <CardDescription>
                Get AI-powered responses instantly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/chat")}
                className="w-full bg-gradient-primary text-primary-foreground glow-primary hover:opacity-90 transition-all"
              >
                Open Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-card/80 backdrop-blur hover:border-secondary transition-all group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-secondary group-hover:animate-float" />
                Generate Images
              </CardTitle>
              <CardDescription>
                Create stunning AI-generated images from your prompts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/image-generation")}
                className="w-full bg-gradient-accent text-accent-foreground glow-accent hover:opacity-90 transition-all"
              >
                Create Image
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;