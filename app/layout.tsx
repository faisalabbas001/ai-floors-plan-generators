import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'FloorPlan AI - Design Floor Plans with AI',
  description: 'Create professional 2D and 3D architectural floor plans with AI. Design and draw floor plans online - free, accurate, and easy to use.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/Flowplanlogo.png',
        type: 'image/png',
      },
    ],
    apple: '/Flowplanlogo.png',
    shortcut: '/Flowplanlogo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
