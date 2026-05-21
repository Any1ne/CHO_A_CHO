import { Skeleton } from "@/components/ui/skeleton";

export default function BuilderLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 gap-6 bg-stone-50">
      <Skeleton className="h-10 w-64 rounded-md" />
      <Skeleton className="h-[60vh] w-full max-w-4xl rounded-xl" />
      <Skeleton className="h-24 w-full max-w-4xl rounded-xl" />
    </div>
  );
}