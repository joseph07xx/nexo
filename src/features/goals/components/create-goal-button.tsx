"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { GoalModal } from "./goal-modal";
import { createGoalAction } from "../actions";

interface CreateGoalButtonProps {
  variant?: "default" | "outline";
  size?: "default" | "lg";
  className?: string;
  label?: string;
}

export function CreateGoalButton({
  variant = "default",
  size = "lg",
  className,
  label = "Nueva meta",
}: CreateGoalButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleSuccess() {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={variant}
        size={size}
        className={className}
      >
        <Plus className="size-5 mr-2" />
        {label}
      </Button>

      <GoalModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        title="Nueva meta"
        action={createGoalAction}
      />
    </>
  );
}