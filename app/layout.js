import "./globals.css";
import { TrialProvider } from "@/context/TrialContext";

export const metadata = {
  title: "AI Creative Platform",
  description: "AI-powered tools for creative writing and storytelling",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TrialProvider>
          {children}
        </TrialProvider>
      </body>
    </html>
  );
}
