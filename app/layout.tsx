import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDFPilot AI — Understand every document",
  description: "Analyze PDFs, compare documents, and ask questions with PDFPilot AI by Shorlah Cloud.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}