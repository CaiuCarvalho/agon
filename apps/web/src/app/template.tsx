'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't show Navbar/Footer on admin pages
  const isAdminPage = pathname?.startsWith('/admin');
  
  if (isAdminPage) {
    return <>{children}</>;
  }
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
