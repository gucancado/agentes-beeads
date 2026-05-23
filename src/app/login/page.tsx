import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>agentes-beeads</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData: FormData) => {
              'use server';
              await signIn('credentials', {
                email: formData.get('email'),
                password: formData.get('password'),
                redirectTo: '/agentes',
              });
            }}
            className="flex flex-col gap-3"
          >
            <Input name="email" type="email" placeholder="email" required />
            <Input name="password" type="password" placeholder="senha" required />
            <Button type="submit">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
