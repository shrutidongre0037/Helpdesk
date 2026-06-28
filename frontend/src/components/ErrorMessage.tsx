import React from "react";

interface ErrorMessageProps {
  title?: string;
  message: string;
}

export function ErrorMessage({ title = "Error", message }: ErrorMessageProps) {
  return (
    <div className="bg-destructive/10 text-destructive p-6 rounded-xl border border-destructive/20 text-center">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p>{message}</p>
    </div>
  );
}
