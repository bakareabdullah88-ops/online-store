import { Skeleton } from "@/components/ui/skeleton";

export function AuthFormSkeleton({ fields }: { fields: number }) {
  return (
    <div className="w-full max-w-md" aria-hidden>
      <Skeleton className="h-11 w-64" />
      <Skeleton className="mt-3 h-4 w-48" />
      <div className="mt-8 flex flex-col gap-5">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i}>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-2 h-11 w-full" rounded="md" />
          </div>
        ))}
        <Skeleton className="h-13 w-full" rounded="md" />
      </div>
    </div>
  );
}
