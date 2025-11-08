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
    <Card className="p-6 bg-card/80 backdrop-blur-sm border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">AI Confirmation</p>
          {isLoading ? (
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <p className="text-base font-medium text-foreground">{displayedMessage}</p>
          )}
        </div>
      </div>
    </Card>
  );
};
