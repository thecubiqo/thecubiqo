"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Briefcase, Users, Heart, Zap, TrendingUp, Sparkles, LucideIcon } from "lucide-react";

type ColorType = "green" | "yellow" | "red";

interface ColorOption {
  id: ColorType;
  label: string;
  description: string;
  contexts: string[];
  icon: LucideIcon;
  secondaryIcon: LucideIcon;
  className: string;
  glowColor: string;
  textColor: string;
  borderActive: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  {
    id: "green",
    label: "Green / Blue",
    description: "Work, Trade & Wellness",
    contexts: ["Professional", "Business", "Health"],
    icon: Briefcase,
    secondaryIcon: TrendingUp,
    className: "rgy-selector-green",
    glowColor: "shadow-glow-green",
    textColor: "text-rgy-green",
    borderActive: "border-rgy-green",
  },
  {
    id: "yellow",
    label: "Yellow",
    description: "Social & Friends",
    contexts: ["Community", "Networking", "Events"],
    icon: Users,
    secondaryIcon: Sparkles,
    className: "rgy-selector-yellow",
    glowColor: "shadow-glow-yellow",
    textColor: "text-rgy-yellow",
    borderActive: "border-rgy-yellow",
  },
  {
    id: "red",
    label: "Red",
    description: "Dating & Adult",
    contexts: ["Romance", "Connections", "Intimate"],
    icon: Heart,
    secondaryIcon: Zap,
    className: "rgy-selector-red",
    glowColor: "shadow-glow-red",
    textColor: "text-rgy-red",
    borderActive: "border-rgy-red",
  },
];

interface RGYColorSelectorProps {
  onColorSelect: (color: ColorType) => void;
  showProMatchBadge?: boolean;
  proMatchCount?: number;
}

export const RGYColorSelector = ({
  onColorSelect,
  showProMatchBadge = false,
  proMatchCount = 0
}: RGYColorSelectorProps) => {
  const [hoveredColor, setHoveredColor] = useState<ColorType | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorType | null>(null);

  const handleSelect = (colorId: ColorType) => {
    setSelectedColor(colorId);
    // Small delay for visual feedback before transition
    setTimeout(() => {
      onColorSelect(colorId);
    }, 200);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12">
      {/* ProMatch Badge */}
      {showProMatchBadge && proMatchCount > 0 && (
        <div className="mb-8 animate-fade-up">
          <div className="bg-surface-2 border border-border rounded-xl px-6 py-3 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-rgy-yellow animate-pulse" />
            <span className="text-sm font-medium">
              <span className="text-rgy-yellow font-mono">{proMatchCount}</span> new opportunities found by AI
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12 animate-fade-up">
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Choose Your Context
        </h2>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Select a color to set the context for your conversations.
          Each color unlocks different intent-based rooms.
        </p>
      </div>

      {/* Color Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-3xl">
        {COLOR_OPTIONS.map((color, index) => {
          const Icon = color.icon;
          const SecondaryIcon = color.secondaryIcon;
          const isHovered = hoveredColor === color.id;
          const isSelected = selectedColor === color.id;

          return (
            <Card
              key={color.id}
              onClick={() => handleSelect(color.id)}
              onMouseEnter={() => setHoveredColor(color.id)}
              onMouseLeave={() => setHoveredColor(null)}
              className={cn(
                "relative cursor-pointer border-2 p-6 sm:p-8",
                "transition-all duration-300 ease-out",
                "bg-surface-1 hover:bg-surface-2",
                color.className,
                isSelected && "active scale-[0.98]",
                isHovered && !isSelected && "scale-[1.02]",
                "animate-fade-up"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Glow effect on hover */}
              <div
                className={cn(
                  "absolute inset-0 rounded-xl transition-opacity duration-300",
                  isHovered || isSelected ? "opacity-100" : "opacity-0"
                )}
                style={{
                  background: `radial-gradient(circle at 50% 50%, hsl(var(--rgy-${color.id}) / 0.1) 0%, transparent 70%)`
                }}
              />

              <div className="relative z-10">
                {/* Icons */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={cn(
                    "p-3 rounded-xl bg-surface-2 border border-border/50",
                    "transition-all duration-300",
                    (isHovered || isSelected) && `border-rgy-${color.id}/50`
                  )}>
                    <Icon className={cn(
                      "h-6 w-6 transition-colors duration-300",
                      (isHovered || isSelected) ? color.textColor : "text-muted-foreground"
                    )} />
                  </div>
                  <SecondaryIcon className={cn(
                    "h-5 w-5 transition-all duration-300",
                    (isHovered || isSelected) ? `${color.textColor} opacity-100` : "text-muted-foreground/50 opacity-50"
                  )} />
                </div>

                {/* Label */}
                <h3 className={cn(
                  "font-display text-xl font-semibold mb-2 transition-colors duration-300",
                  (isHovered || isSelected) ? color.textColor : "text-foreground"
                )}>
                  {color.label}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm mb-4">
                  {color.description}
                </p>

                {/* Context tags */}
                <div className="flex flex-wrap gap-2">
                  {color.contexts.map((context) => (
                    <span
                      key={context}
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-mono",
                        "bg-surface-2 text-muted-foreground border border-border/50",
                        "transition-all duration-300",
                        (isHovered || isSelected) && `border-rgy-${color.id}/30 text-rgy-${color.id}/80`
                      )}
                    >
                      {context}
                    </span>
                  ))}
                </div>

                {/* Selection indicator */}
                <div className={cn(
                  "absolute top-4 right-4 w-3 h-3 rounded-full transition-all duration-300",
                  isSelected ? `bg-rgy-${color.id} scale-100` : "scale-0"
                )} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Footer hint */}
      <p className="mt-10 text-muted-foreground/60 text-sm font-mono animate-fade-in" style={{ animationDelay: '400ms' }}>
        Select a context to browse available rooms
      </p>
    </div>
  );
};
