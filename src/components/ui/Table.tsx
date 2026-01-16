import React from "react";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = "" }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className={`w-full ${className}`}>{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="bg-[var(--surface-hover)]">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-[var(--border)]">{children}</tbody>;
}

export function TableRow({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${
        onClick ? "cursor-pointer hover:bg-[var(--surface-hover)]" : ""
      } ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-3 py-2 text-sm text-[var(--foreground)] ${className}`}>
      {children}
    </td>
  );
}
