import { auth } from '@/lib/auth';
import { AppSidebar } from '@/components/app-sidebar';
import { Topbar } from '@/components/topbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userEmail = session?.user?.email ?? null;

  return (
    <div className="grid min-h-screen grid-cols-[248px_1fr] bg-paper">
      <AppSidebar />
      <div className="flex flex-col min-w-0">
        <Topbar userEmail={userEmail} />
        <main className="flex-1 px-6 py-7 sm:px-8 lg:px-10 mx-auto w-full max-w-[1100px] 3xl:max-w-[1700px]">
          {children}
        </main>
      </div>
    </div>
  );
}
