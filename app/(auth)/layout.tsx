export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="storefront flex min-h-screen w-full items-center justify-center outline-none"
    >
      {children}
    </main>
  );
}
