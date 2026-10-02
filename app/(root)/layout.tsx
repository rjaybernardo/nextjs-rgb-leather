import Footer from "@/components/footer";
import Header from "@/components/shared/header";

export default function RootGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main id="main-content" tabIndex={-1} className="wrapper flex-1 outline-none">{children}</main>

      <Footer />
    </div>
  );
}
