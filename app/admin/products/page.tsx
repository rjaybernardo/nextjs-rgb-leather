import { requireAdmin } from "@/lib/auth-guard";
import { getAllProducts } from "@/lib/actions/product.actions";

const AdminProductsPage = async (props: {
  searchParams: Promise<{
    page?: string;
    query?: string;
    category?: string;
  }>;
}) => {
  await requireAdmin();

  const searchParams = await props.searchParams;

  const page = Number(searchParams.page) || 1;
  const searchText = searchParams.query || "";
  const category = searchParams.category || "";

  const products = await getAllProducts({
    query: searchText,
    page,
    category,
  });

  return (
    <div className="space-y-2">
      <div className="flex-between">
        <h1 className="h2-bold">Products</h1>
      </div>

      <pre className="overflow-x-auto rounded-md border p-4 text-sm">
        {JSON.stringify(products, null, 2)}
      </pre>
    </div>
  );
};

export default AdminProductsPage;
