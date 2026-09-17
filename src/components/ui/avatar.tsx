import React from "react";

export interface Collaborator {
  id: string;
  name: string;
  initials: string;
  color: string; // background color hex or tailwind class
  textColor?: string;
  role?: string;
}

export const SAMPLE_COLLABORATORS: Collaborator[] = [
  { id: "1", name: "Adi", initials: "AD", color: "#3B82F6", role: "Editor" },
  { id: "2", name: "Elena", initials: "EL", color: "#F59E0B", role: "Editor" },
  { id: "3", name: "Priya", initials: "PR", color: "#10B981", role: "Viewer" },
  { id: "4", name: "Rahul", initials: "RA", color: "#8B5CF6", role: "Editor" },
];

export function Avatar({
  collaborator,
  size = "md",
}: {
  collaborator: Collaborator;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-7 h-7 text-xs",
    lg: "w-8 h-8 text-sm",
  }[size];

  return (
    <div
      title={`${collaborator.name} (${collaborator.role || "Collaborator"})`}
      className={`${sizeClasses} rounded-full flex items-center justify-center font-medium text-white ring-2 ring-white select-none transition-transform hover:scale-105 hover:z-10 shadow-2xs`}
      style={{ backgroundColor: collaborator.color }}
    >
      {collaborator.initials}
    </div>
  );
}

export function AvatarStack({
  collaborators = SAMPLE_COLLABORATORS,
  max = 3,
  size = "md",
}: {
  collaborators?: Collaborator[];
  max?: number;
  size?: "sm" | "md" | "lg";
}) {
  const visible = collaborators.slice(0, max);
  const remaining = collaborators.length - max;

  const remainderSize = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-7 h-7 text-[11px]",
    lg: "w-8 h-8 text-xs",
  }[size];

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((c) => (
        <Avatar key={c.id} collaborator={c} size={size} />
      ))}
      {remaining > 0 && (
        <div
          title={`${remaining} more collaborator${remaining > 1 ? "s" : ""}`}
          className={`${remainderSize} rounded-full bg-slate-100 ring-2 ring-white flex items-center justify-center font-medium text-slate-600 select-none hover:bg-slate-200 shadow-2xs`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
