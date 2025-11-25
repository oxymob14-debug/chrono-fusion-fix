import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Download, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ImageGeneration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
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

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    // Check if user has reached free limit
    if (profile?.role === "free" && (profile?.image_generation_count || 0) >= 5) {
      toast({
        variant: "destructive",
        title: "Free limit reached",
        description: "You've used all 5 free image generations. Upgrade to Pro for unlimited!",
      });
      navigate("/subscription");
      return;
    }

    setLoading(true);

    try {
      // Call image generation edge function
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt }
      });

      if (error) throw error;

      setGeneratedImage(data.imageUrl);

      // Update image generation count
      await supabase
        .from("profiles")
        .update({ image_generation_count: (profile?.image_generation_count || 0) + 1 })
        .eq("id", profile.id);

      toast({
        title: "Image generated!",
        description: "Your AI-generated image is ready.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to generate image",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: "Your image is being downloaded.",
    });
  };

  const remainingGenerations = profile?.role === "pro" ? "Unlimited" : Math.max(0, 5 - (profile?.image_generation_count || 0));

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <Navigation isAuthenticated={true} />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold gradient-text mb-2">Image Generation</h1>
          <p className="text-muted-foreground">
            Create stunning AI-generated images from your imagination • {remainingGenerations} generations remaining
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card className="p-6 border-primary/20 bg-card/80 backdrop-blur">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Describe Your Image
              </h2>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., A futuristic cyberpunk cityscape at night with neon lights..."
                className="min-h-[200px] border-primary/30 focus:border-primary bg-background/50 mb-4"
                disabled={loading}
              />
              <Button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="w-full bg-gradient-accent text-accent-foreground glow-accent hover:opacity-90 transition-all"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
              {profile?.role === "free" && remainingGenerations === 0 && (
                <Button
                  onClick={() => navigate("/subscription")}
                  variant="outline"
                  className="w-full mt-2 border-primary/30"
                >
                  Upgrade to Pro for Unlimited Generations
                </Button>
              )}
            </Card>
          </div>

          <div>
            <Card className="p-6 border-primary/20 bg-card/80 backdrop-blur h-full">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-secondary" />
                Generated Image
              </h2>
              {generatedImage ? (
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-primary/20 glow-primary">
                    <img
                      src={generatedImage}
                      alt="Generated"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-gradient-primary text-primary-foreground glow-primary"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Image
                  </Button>
                </div>
              ) : (
                <div className="aspect-square rounded-lg border-2 border-dashed border-primary/20 flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Your generated image will appear here</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGeneration;