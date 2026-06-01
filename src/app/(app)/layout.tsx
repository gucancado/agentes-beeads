import { redirect } from 'next/navigation';
import { getAuthUser, getCurrentUrl, loginUrl, getRawCookieHeader } from '@/lib/auth';
import { loadAccessibleAgents } from '@/lib/registry-server';
import { meProfile } from '@/lib/bloquim-client';
import { AppSidebar } from '@/components/app-sidebar';
import { Topbar } from '@/components/topbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) {
    const here = await getCurrentUrl();
    redirect(loginUrl(here));
  }

  const cookie = await getRawCookieHeader();
  const [agents, profile] = await Promise.all([
    loadAccessibleAgents(cookie),
    meProfile(cookie),
  ]);

  const sidebarUser = {
    name: profile?.name ?? user.email,
    email: profile?.email ?? user.email,
    avatarUrl: profile?.avatarUrl ?? null,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <AppSidebar agents={agents} user={sidebarUser} />
      <div className="flex flex-col min-w-0 flex-1 h-screen">
        <Topbar />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-6 py-7 sm:px-8 lg:px-10 mx-auto w-full max-w-[1100px] 3xl:max-w-[1700px] h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
