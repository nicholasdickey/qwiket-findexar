
import { Inter, Roboto } from "next/font/google";
//import { ThemeProvider } from 'next-themes'
import { ClerkProvider } from '@clerk/nextjs'
import StyledComponentsRegistry from '@/lib/registry'
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });
const roboto = Roboto({ subsets: ['latin'], weight: ['300', '400', '700'], style: ['normal', 'italic'] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={roboto.className}>
        <ClerkProvider>
          <StyledComponentsRegistry>
            {children}
          </StyledComponentsRegistry>
        </ClerkProvider>
      </body>
    </html>
  );
}
