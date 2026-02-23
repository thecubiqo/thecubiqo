"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { cn } from "@/lib/utils";
import {
  List,
  LayoutGrid,
  Square,
  MapPin,
  Send,
  MoreHorizontal,
  Users,
  Clock,
  Activity,
  Sparkles,
  LucideIcon,
} from "lucide-react";
import type { Room } from "./RGYIntentKeywordList";

type ColorType = "green" | "yellow" | "red";

interface DisplayMode {
  id: string;
  label: string;
  icon: LucideIcon;
}

const DISPLAY_MODES: DisplayMode[] = [
  { id: "list", label: "List", icon: List },
  { id: "card", label: "Card", icon: Square },
  { id: "grid", label: "Grid", icon: LayoutGrid },
  { id: "map", label: "Map", icon: MapPin },
];

interface Message {
  id: number;
  type: "system" | "capsule";
  capsuleId?: string;
  content: string;
  timestamp: Date;
  isOwn?: boolean;
}

const generateMockMessages = (roomName: string): Message[] => [
  {
    id: 1,
    type: "system",
    content: `Room "${roomName}" joined. Messages are end-to-end encrypted.`,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: 2,
    type: "capsule",
    capsuleId: "CQ-7829",
    content: "Looking for collaborators on a React/TypeScript project. Need frontend expertise.",
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
  },
  {
    id: 3,
    type: "capsule",
    capsuleId: "CQ-4521",
    content: "Interested! What's the scope? I have 3 years of React experience.",
    timestamp: new Date(Date.now() - 1000 * 60 * 20),
  },
  {
    id: 4,
    type: "capsule",
    capsuleId: "CQ-9103",
    content: "Building something similar. Open to knowledge exchange if helpful.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 5,
    type: "system",
    content: "CQ-2847 has entered the room",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    id: 6,
    type: "capsule",
    capsuleId: "CQ-2847",
    content: "Anyone here working on AI integration? Looking for trade opportunities.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
];

interface RGYRoomViewProps {
  room: Room;
  color: ColorType;
  onBack: () => void;
}

const COLOR_HEX: Record<ColorType, string> = {
  green: "#2D994E",
  yellow: "#F2C94C",
  red: "#E84343",
};

export const RGYRoomView = ({ room, color, onBack }: RGYRoomViewProps) => {
  const [displayMode, setDisplayMode] = useState("list");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(generateMockMessages(room.name));
  }, [room.name]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    const newMessage: Message = {
      id: messages.length + 1,
      type: "capsule",
      capsuleId: "CQ-YOU",
      content: inputValue,
      timestamp: new Date(),
      isOwn: true,
    };
    setMessages([...messages, newMessage]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const IntentIcon = room.intent.icon;
  const accentColor = COLOR_HEX[color];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Room Header */}
      <div className="border-b border-border/50 bg-surface-1/50 backdrop-blur-sm px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg border border-border/50 bg-surface-2">
                <IntentIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">{room.name}</h2>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {room.memberCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Display mode switcher */}
            <div className="flex items-center gap-1">
              {DISPLAY_MODES.map((mode) => {
                const ModeIcon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setDisplayMode(mode.id)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      displayMode === mode.id
                        ? "bg-surface-3 text-foreground"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    )}
                    title={mode.label}
                  >
                    <ModeIcon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          {displayMode === "list" && (
            <ListViewMessages messages={messages} formatTime={formatTime} accentColor={accentColor} />
          )}
          {displayMode === "card" && (
            <CardViewMessages messages={messages} formatTime={formatTime} accentColor={accentColor} />
          )}
          {displayMode === "grid" && (
            <GridViewMessages messages={messages} formatTime={formatTime} accentColor={accentColor} />
          )}
          {displayMode === "map" && <MapViewPlaceholder />}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-border/50 bg-surface-1/50 backdrop-blur-sm px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-10 bg-surface-2 border-border/50"
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
          <p className="text-xs text-muted-foreground/60 mt-2 font-mono">
            Messages are anonymous. CQ-to-CQ private chats happen outside RGY.
          </p>
        </div>
      </div>
    </div>
  );
};

interface MessageViewProps {
  messages: Message[];
  formatTime: (date: Date) => string;
  accentColor: string;
}

const ListViewMessages = ({ messages, formatTime, accentColor }: MessageViewProps) => (
  <div className="space-y-3">
    {messages.map((msg) => (
      <div
        key={msg.id}
        className={cn("animate-fade-up", msg.isOwn && "flex justify-end")}
      >
        {msg.type === "system" ? (
          <div className="flex items-center justify-center py-2">
            <span className="text-xs text-muted-foreground/60 font-mono bg-surface-2 px-3 py-1 rounded-full">
              {msg.content}
            </span>
          </div>
        ) : (
          <Card
            className={cn(
              "max-w-[80%] p-3 border border-border/50",
              msg.isOwn ? "bg-surface-2" : "bg-surface-1"
            )}
            style={msg.isOwn ? { borderColor: `${accentColor}40` } : undefined}
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <Badge variant="outline" className="font-mono text-xs">
                {msg.capsuleId}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                {formatTime(msg.timestamp)}
              </span>
            </div>
            <p className="text-sm text-foreground/90">{msg.content}</p>
          </Card>
        )}
      </div>
    ))}
  </div>
);

const CardViewMessages = ({ messages, formatTime, accentColor }: MessageViewProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {messages
      .filter((m) => m.type !== "system")
      .map((msg) => (
        <Card
          key={msg.id}
          className="p-4 border border-border/50 animate-fade-up bg-surface-2"
          style={msg.isOwn ? { borderColor: `${accentColor}40` } : undefined}
        >
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline" className="font-mono text-xs">
              {msg.capsuleId}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatTime(msg.timestamp)}
            </div>
          </div>
          <p className="text-sm text-foreground/90 line-clamp-3">{msg.content}</p>
        </Card>
      ))}
  </div>
);

const GridViewMessages = ({ messages, formatTime, accentColor }: MessageViewProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
    {messages
      .filter((m) => m.type !== "system")
      .map((msg) => (
        <Card
          key={msg.id}
          className="p-3 border border-border/50 animate-fade-up aspect-square flex flex-col bg-surface-2"
          style={msg.isOwn ? { borderColor: `${accentColor}40` } : undefined}
        >
          <Badge variant="outline" className="font-mono text-xs self-start mb-2">
            {msg.capsuleId}
          </Badge>
          <p className="text-xs text-foreground/90 flex-1 line-clamp-4">{msg.content}</p>
          <span className="text-[10px] text-muted-foreground font-mono mt-auto">
            {formatTime(msg.timestamp)}
          </span>
        </Card>
      ))}
  </div>
);

const MapViewPlaceholder = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="p-4 rounded-2xl bg-surface-2 border border-border/50 mb-4">
      <MapPin className="h-10 w-10 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium mb-2">Map View</h3>
    <p className="text-sm text-muted-foreground text-center max-w-xs">
      Geographic visualization available when room content is geo-relevant.
      This room doesn&apos;t have location data.
    </p>
    <Badge variant="outline" className="mt-4 font-mono text-xs">
      <Sparkles className="h-3 w-3 mr-1" />
      Coming soon
    </Badge>
  </div>
);
