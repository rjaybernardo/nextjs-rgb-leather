import Footer from "@/components/footer";
import Header from "@/components/shared/header";

export default function RootGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="storefront flex min-h-screen flex-col">
      <Header />

      <main id="main-content" tabIndex={-1} className="wrap flex-1 py-5 outline-none">{children}</main>

      <Footer />
    </div>
  );
}
