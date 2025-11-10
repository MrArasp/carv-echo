import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Wallet, TrendingUp, Shield, Clock, Award, Trophy, Gift, Badge as BadgeIcon, ArrowRight } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const steps = [
    { icon: Wallet, text: "Connect using Backpack wallet with CARV RPC", detail: "https://rpc.testnet.carv.io/rpc" },
    { icon: TrendingUp, text: "Choose prediction direction (±10%)" },
    { icon: Shield, text: "Recorded on CARV blockchain" },
    { icon: Clock, text: "Automatic daily evaluation at 00:00 UTC" },
    { icon: Award, text: "Earn points for accuracy" },
    { icon: Trophy, text: "Climb the Ranking Board" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background relative overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: "url('/src/assets/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed"
        }}
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-hero opacity-60 z-0" />
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent z-0" />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl animate-fade-in">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            CARV Echo
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Blockchain-Based Price Prediction Game
          </p>
          <Button
            onClick={() => navigate("/prediction")}
            size="lg"
            variant="glow"
            className="text-xl px-12 py-6 h-auto group"
          >
            Start Prediction
            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Project Idea and Goal */}
        <Card className="mb-8 animate-fade-in border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg bg-primary/10 glow-primary">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4 text-foreground">Project Idea and Goal</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The idea behind this platform is to combine <span className="text-primary font-semibold">CARV cryptocurrency price prediction</span> with a <span className="text-accent font-semibold">blockchain-based scoring and ranking mechanism</span>.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Our goal is to create a transparent, engaging, and competitive environment where users can test their analytical insight into the CARV market and earn points and higher ranks for accurate predictions.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  In essence, this project is a <span className="text-secondary font-semibold">blockchain-based analytical prediction game</span> that offers users both an educational and competitive experience, while generating valuable behavioral data from the collective analysis of the CARV community.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="mb-8 animate-fade-in border-accent/20 hover:border-accent/40 transition-all duration-300">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-8 text-center text-foreground">How It Works</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-card/50 hover:bg-card/70 transition-all duration-300">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg glow-primary">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-accent" />
                        <p className="text-foreground font-medium">{step.text}</p>
                      </div>
                      {step.detail && (
                        <p className="text-xs text-muted-foreground mt-1 break-all">{step.detail}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ranking and Rewards System */}
        <Card className="mb-12 animate-fade-in border-secondary/20 hover:border-secondary/40 transition-all duration-300">
          <CardContent className="p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg bg-secondary/10 glow-secondary">
                <Trophy className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-4 text-foreground">Ranking and Rewards System</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Each user earns points based on prediction accuracy, daily activity, and participation level. User rankings are updated daily and monthly.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                    <Gift className="w-5 h-5 text-primary" />
                    <span className="text-foreground font-medium">Exclusive NFTs</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                    <BadgeIcon className="w-5 h-5 text-accent" />
                    <span className="text-foreground font-medium">Honor Badges</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
                    <Trophy className="w-5 h-5 text-secondary" />
                    <span className="text-foreground font-medium">CARV Tokens</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Landing;
