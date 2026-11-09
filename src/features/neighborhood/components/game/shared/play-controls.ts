import {
  Armchair,
  Backpack,
  BookOpen,
  Camera,
  CircleHelp,
  ClipboardList,
  Compass,
  Home,
  Images,
  Map,
  MapPin,
  MessageCircle,
  PawPrint,
  Settings2,
  Smile,
  Sprout,
  Users,
  Volume2,
} from "lucide-react";
export const PLAY_CONTROLS = [
  { id: "explore", label: "Explore", Icon: Compass },
  { id: "home", label: "My house", Icon: Home },
  { id: "animals", label: "Animals", Icon: PawPrint },
  { id: "yard", label: "Yard", Icon: Sprout },
  { id: "friends", label: "Friends", Icon: Users },
  { id: "chat", label: "Chat", Icon: MessageCircle },
  { id: "decorate", label: "Decorate", Icon: Armchair },
  { id: "journal", label: "Journal", Icon: BookOpen },
  { id: "inventory", label: "Backpack", Icon: Backpack },
  { id: "missions", label: "Missions", Icon: ClipboardList },
  { id: "soundboard", label: "Cat sounds", Icon: Volume2 },
  { id: "reactions", label: "React", Icon: Smile },
  { id: "photo", label: "Photo", Icon: Camera },
  { id: "album", label: "Album", Icon: Images },
  { id: "world", label: "Community", Icon: Map },
  { id: "places", label: "Places map", Icon: MapPin },
  { id: "story-map", label: "Story map", Icon: Map },
  { id: "settings", label: "Settings", Icon: Settings2 },
  { id: "help", label: "Help", Icon: CircleHelp },
] as const;
export type PlayControlId = (typeof PLAY_CONTROLS)[number]["id"];
export type PlayControlAction = {
  onSelect: () => void;
  disabled?: boolean;
  active?: boolean;
  badge?: number;
};
export type PlayControlActions = Record<PlayControlId, PlayControlAction>;
