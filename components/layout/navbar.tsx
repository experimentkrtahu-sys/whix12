import Link from 'next/link';
import { getSession } from '@/lib/auth/session';

export async function Navbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-background/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-white">StreamCatalog</Link>
        <nav className="flex items-center gap-4 text-sm text-slate-300">
          <Link href="/browse">Browse</Link>
          {session ? (
            <>
              <Link href="/watchlist">Watchlist</Link>
              <Link href="/profile">Profile</Link>
              {session.role === 'ADMIN' && <Link href="/admin">Admin</Link>}
              <form action="/api/auth/logout" method="post"><button>Logout</button></form>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
