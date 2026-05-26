import { redirect } from 'next/navigation';
import { getAuthUser, getCurrentUrl, loginUrl } from '@/lib/auth';
import { AppSidebar } from '@/components/app-sidebar';
import { Topbar } from '@/components/topbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) {
    const here = await getCurrentUrl();
    redirect(loginUrl(here));
  }

  return (
    <div className="grid min-h-screen grid-cols-[248px_1fr] bg-bg">
      <AppSidebar />
      <div className="flex flex-col min-w-0">
        <Topbar userEmail={user.email} />
        <main className="flex-1 px-6 py-7 sm:px-8 lg:px-10 mx-auto w-full max-w-[1100px] 3xl:max-w-[1700px]">
          {children}
        </main>
      </div>
    </div>
  );
}
