export default function AuthLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4 dark:bg-slate-900">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
