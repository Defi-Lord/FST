import React, { useEffect } from 'react';
import { setMainButton, tg } from '../../lib/tg';
import Button from '../components/Button';

export default function Home({ user }: { user?: any }) {
  useEffect(() => {
    setMainButton('Continue', () => tg.HapticFeedback?.impactOccurred('light'));
  }, []);

  return (
    <div className="space-y-4">
      <header className="mt-2">
        <h1 className="text-[24px] leading-[28px] font-semibold">Fantasy Football</h1>
        {user && <p className="text-sm text-hint">Hi {user.first_name}</p>}
      </header>

      <section className="bg-secondary rounded-figma p-4 shadow-figma">
        <p className="text-[14px] leading-[20px]">Replace this with your Figma section.</p>
        <div className="mt-3 flex gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>
    </div>
  );
}
