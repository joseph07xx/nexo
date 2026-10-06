import { NexoLogo } from "@/components/brand/nexo-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <NexoLogo size={48} />
        </div>
        {children}
      </div>
    </div>
  );
}