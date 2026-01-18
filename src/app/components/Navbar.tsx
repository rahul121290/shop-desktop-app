'use client'; // If using state/hooks

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="flex bg-white p-4 shadow-md">
      <Link href="/" className={`mr-4 p-2 ${pathname === '/' ? 'font-bold' : ''}`}>
        Home
      </Link>
      <Link href="/billing" className={`mr-4 p-2 ${pathname === '/about' ? 'font-bold' : ''}`}>
        Billing
      </Link>
      <Link href="/ledger" className={`mr-4 p-2 ${pathname === '/about' ? 'font-bold' : ''}`}>
        Ledger
      </Link>
      <Link href="/inventory" className={`mr-4 p-2 ${pathname === '/inventory' ? 'font-bold' : ''}`}>
        Inventory
      </Link>
      {/* Add more links */}
    </nav>
  );
}
