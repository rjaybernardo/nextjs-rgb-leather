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

      <main className="wrapper flex-1">{children}</main>

      <Footer />
    </div>
  );
}
