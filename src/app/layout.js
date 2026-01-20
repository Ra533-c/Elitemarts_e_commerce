import { Toaster } from "react-hot-toast";
import "./globals.css";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";

export const metadata = {
  title: "EliteMarts - Robotic Neck & Shoulder Massager",
  description: "Professional-grade relief at home. Get instant relaxation with our premium robotic massager.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
