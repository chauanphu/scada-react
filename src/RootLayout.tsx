import { WebSocketProvider } from "./contexts/WebsocketProvider";
import { APIProvider } from "./contexts/APIProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <APIProvider>
          <WebSocketProvider>
            <main className="h-screen">{children}</main>
          </WebSocketProvider>
        </APIProvider>
      </body>
    </html>
  );
}
