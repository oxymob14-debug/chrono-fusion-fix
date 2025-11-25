import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    if (session) navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <Navigation isAuthenticated={isAuthenticated} />
      <section className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-5xl mx-auto text-center animate-slide-up">
          <div className="inline-block mb-6">
            <div className="p-4 rounded-3xl bg-gradient-primary glow-primary animate-float">
              <Sparkles className="w-16 h-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">AI Fusion Assistant</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Harness the power of <span className="text-primary font-semibold">AI</span> with intelligent chat responses and stunning image generation
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate("/register")} className="bg-gradient-primary text-primary-foreground glow-primary hover:opacity-90 text-lg px-8 py-6">
              Get Started <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button onClick={() => navigate("/login")} variant="outline" className="border-primary/30 hover:bg-primary/10 text-lg px-8 py-6">
              Sign In
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
