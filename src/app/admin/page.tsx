'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const router = useRouter();

  const MENU = [
    {
      label: 'Dashboard Bencana',
      desc: 'Lihat executive dashboard data bencana nasional secara real-time dan analisis spasial.',
      href: '/dashboard',
      bg: 'bg-primary/10',
      color: 'text-primary',
    },
    {
      label: 'Management Data',
      desc: 'Kelola dan lihat daftar layanan geospasial Inarisk BNPB, parameter bencana, dan metadata.',
      href: '/management',
      bg: 'bg-secondary/10',
      color: 'text-secondary',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">
          Selamat datang, Admin 👋
        </h2>
        <p className="text-sm text-muted-foreground">
          Gunakan panel kontrol ini untuk mengarahkan manajemen dan visibilitas data bencana nasional.
        </p>
      </div>

      {/* Menu Cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {MENU.map((m) => (
          <Button
            key={m.label}
            variant="default"
            className={cn(
              "group flex h-[120px] w-full items-center justify-between px-6 py-4 rounded-lg",
              m.bg,
              "hover:bg-primary/20 transition-colors",
              "border border-border",
              "dark:hover:bg-primary/20"
            )}
            onClick={() => router.push(m.href)}
          >
            <div className="flex-shrink-0">
              {/* Placeholder icon - you can replace with actual icon later */}
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/20">
                {/* Simple icon placeholder */}
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {m.label === 'Dashboard Bencana' ? (
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  ) : (
                    <rect x="3" y="4" width="18" height="16" rx="2" ry="2"/>
                  )}
                </svg>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <h3 className={cn("text-lg font-semibold", m.color, "group-hover:text-primary/90")}>
                {m.label}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {m.desc}
              </p>
            </div>
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary/90 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}