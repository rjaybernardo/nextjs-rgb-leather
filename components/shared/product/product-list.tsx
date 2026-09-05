import type { Product } from "@/types";

type ProductListProps = {
  data: Product[];
  title?: string;
  limit?: number;
};

const ProductList = ({ data, title, limit }: ProductListProps) => {
  const limitedData = limit !== undefined ? data.slice(0, limit) : data;

  return (
    <section className="my-10">
      {title && <h2 className="h2-bold mb-4">{title}</h2>}

      {limitedData.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {limitedData.map((product) => (
            <div key={product.slug} className="rounded-lg border p-4">
              {product.name}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <p>No products found</p>
        </div>
      )}
    </section>
  );
};

export default ProductList;
