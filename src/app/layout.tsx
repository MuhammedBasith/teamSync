import { Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata = {
  title: "TeamSync",
  description: "Multi-organization team management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
