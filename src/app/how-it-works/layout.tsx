import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How It Works | Typhoon Deep Research',
  description: 'Learn about the high-level algorithm behind Typhoon Deep Research',
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 