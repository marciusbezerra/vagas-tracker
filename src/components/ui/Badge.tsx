import React from "react";
import { JobStatus } from "@/generated/prisma/enums";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  status?: JobStatus;
}

export function Badge({ children, variant = "default", status }: BadgeProps) {
  // Map JobStatus to variant if status is provided
  const getVariantFromStatus = (
    status: JobStatus
  ): "default" | "success" | "warning" | "error" | "info" => {
    switch (status) {
      case JobStatus.NEW:
        return "info";
      case JobStatus.APPLIED:
        return "default";
      case JobStatus.INTERVIEWING:
        return "warning";
      case JobStatus.IN_CONTACT:
        return "warning";
      case JobStatus.SEE_LATER:
        return "default";
      case JobStatus.REJECTED:
        return "error";
      case JobStatus.DISCARDED:
        return "error";
      default:
        return "default";
    }
  };

  const effectiveVariant = status ? getVariantFromStatus(status) : variant;

  const variants = {
    default: "bg-[var(--surface-hover)] text-[var(--foreground)]",
    success: "bg-[var(--success-light)] text-[var(--success)]",
    warning: "bg-[var(--warning-light)] text-[var(--warning)]",
    error: "bg-[var(--error-light)] text-[var(--error)]",
    info: "bg-[var(--info-light)] text-[var(--info)]",
  };

  return (
    <span className={`badge ${variants[effectiveVariant]}`}>{children}</span>
  );
}
