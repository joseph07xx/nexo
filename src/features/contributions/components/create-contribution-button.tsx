"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ContributionModal } from "./contribution-modal";
import { createContributionAction } from "../actions";

interface CreateContributionButtonProps {
  variant?: "default" | "outline";
  size?: "default" | "lg";
  className?: string;
  label?: string;
}

export function CreateContributionButton({
  variant = "default",
  size = "lg",
  className,
  label = "Registrar aporte",
}: CreateContributionButtonProps) {
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

      <ContributionModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        title="Registrar aporte"
        action={createContributionAction}
      />
    </>
  );
}