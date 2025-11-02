import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface AIConfirmationProps {
  message: string;
  isLoading: boolean;
}

export const AIConfirmation = ({ message, isLoading }: AIConfirmationProps) => {
  const [displayedMessage, setDisplayedMessage] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!message) {
      setDisplayedMessage("");
      setCurrentIndex(0);
      return;
    }

    if (currentIndex < message.length) {
      const timeout = setTimeout(() => {
        setDisplayedMessage(message.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 20);
      return () => clearTimeout(timeout);
    }
  }, [message, currentIndex]);

  if (!message && !isLoading) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-secondary/20 to-primary/20 backdrop-blur-sm border-secondary/40 glow-secondary">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-full bg-secondary/20">
          <Sparkles className="h-6 w-6 text-secondary animate-pulse-glow" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">Grok AI says:</p>
          {isLoading ? (
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <p className="text-lg font-medium text-foreground">{displayedMessage}</p>
          )}
        </div>
      </div>
    </Card>
  );
};
