import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  to: string;
  label: string;
  className?: string;
}

export function BackButton({ to, label, className = "mb-6" }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <Button variant="ghost" onClick={() => navigate(to)} className={className}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
}
