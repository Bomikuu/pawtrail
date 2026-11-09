import abilityRules from './abilities/definitions.json'
export const REACTIONS = [
  ["wave", "Wave"],
  ["heart", "Heart"],
  ["laughing", "Laugh"],
  ["sick", "Sick"],
  ["happy", "Happy"],
  ["sad", "Sad / cry"],
  ["angry", "Angry"],
  ["surprised", "Surprised"],
  ["confused", "Confused"],
  ["sleepy", "Sleep · Zzz"],
  ["tired", "Tired"],
  ["dance", "Disco dance"],
  ["float", "Float on a cloud"],
  ["car", "Car rooftop ride"],
  ["clap", "Clap"],
  ["cheer", "Cheer"],
  ["power_up", "Power up"],
  ["jetpack", "Jetpack"],
  ["rescue_dash","Rescue Dash"],
  ["gentle_approach","Gentle Approach"],
  ["paw", "Paw love"],
] as const;
export function reactionEffect(id: string) {
  if (id === "car") return "paw";
  if (id === "sick") return "sleepy";
  if (id === "float") return "paw";
  if (id === "tired") return "sleepy";
  return ["dance", "clap", "cheer"].includes(id) ? "celebration" : id;
}
export function reactionAnimation(id: string) {
  return ({ sleepy: "sleep", laughing: "laugh", car: "ride", heart: "cheer", paw: "cheer" } as Record<string, string>)[id] ??
    (["rescue_dash","gentle_approach","jetpack", "power_up", "wave", "happy", "sad", "angry", "dance", "float", "tired", "surprised", "play", "sick", "clap", "cheer"].includes(id) ? id : "laugh");
}
export function richReaction(id: string) {
  return ["rescue_dash","gentle_approach","jetpack", "power_up", "sad", "happy", "angry", "dance", "float", "sleepy", "tired", "surprised", "play", "laughing", "sick", "car", "cheer"].includes(id);
}
export function reactionDuration(id: string) {
  if(Object.hasOwn(abilityRules.abilities,id))return abilityRules.abilities[id as keyof typeof abilityRules.abilities].durationMs;
  return id==='jetpack' ? 8000 : id === "car" ? 5200 : ["power_up", "dance", "float", "sleepy", "tired", "play", "sick"].includes(id) ? 3600 : 2700;
}
