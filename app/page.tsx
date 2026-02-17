import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

function isMobileDevice(userAgent: string, secChUaMobile: string | null) {
  if (secChUaMobile === '?1') return true;
  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone|IEMobile|Opera Mini/i.test(userAgent);
}

export default async function HomePage() {
  const headerStore = await headers();
  const userAgent = headerStore.get('user-agent') ?? '';
  const secChUaMobile = headerStore.get('sec-ch-ua-mobile');

  if (isMobileDevice(userAgent, secChUaMobile)) {
    redirect('/catalog/categories');
  }

  redirect('/catalog');
}
