import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col  min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] relative">
      <div className="absolute inset-0 bg-[url('/bg.png')] bg-cover bg-center opacity-40 z-0"></div>
      <div className="relative z-10">
        <h1 className="font-bold text-center mt-12 ">
          <span className="text-3xl italic opacity-0 translate-y-4 animate-[fade-in-up_1s_ease-out_forwards]">
            Welcome to
          </span>
          <br className="pt-2" />
          <span className="text-7xl opacity-0 translate-y-4 animate-[fade-in-up_1s_ease-out_forwards] delay-1000">
            Kill the Robot
          </span>
        </h1>

        <div className="flex flex-col gap-8 items-center mt-16">
          <div className="opacity-0 translate-y-4 animate-[fade-in-up_0.5s_ease-out_forwards] delay-2000">
            <Link href="/create">
              <Button>Create a Game</Button>
            </Link>
          </div>
          <div className="opacity-0 translate-y-4 animate-[fade-in-up_0.5s_ease-out_forwards] delay-2500">
            <Link href="/join">
              <Button>Join a Game</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
