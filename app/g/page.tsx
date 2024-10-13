/* eslint-disable react/no-unescaped-entities */
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  });
  return (
    <div className="flex flex-col items-center p-4 pt-24">
      <div className="w-full max-w-[600px] space-y-1">
        <h2>Oops, not sure what you're looking for</h2>
        <Link href="/" className="underline mt-4">
          ← Return Home
        </Link>
      </div>
    </div>
  );
}
