import { redirect } from 'next/navigation';

/**
 * Local login page is no longer used — auth is handled by Bloquim SSO.
 * Any direct hit to /login redirects immediately to the Bloquim login page.
 */
export default function LoginPage() {
  redirect('https://bloquim.beeads.com.br/login');
}
