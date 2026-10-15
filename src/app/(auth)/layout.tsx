import { AuthBrandPanel } from "@/components/auth/brand-panel";
import { Logo } from "@/components/shell/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-surface lg:grid-cols-[minmax(0,560px)_1fr] xl:grid-cols-[640px_1fr]">
      <div className="flex flex-col">
        <div className="flex h-16 items-center px-6 md:px-10">
          <Logo />
        </div>
        <div className="flex flex-1 items-start justify-center px-6 pt-6 pb-16 md:items-center md:px-10">
          {children}
        </div>
      </div>
      <AuthBrandPanel />
    </div>
  );
}
