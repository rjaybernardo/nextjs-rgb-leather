import ProductList from "@/components/shared/product/product-list";
import sampleData from "@/db/sample-data";

const HomePage = () => {
  return (
    <div className="space-y-8">
      <h1 className="h2-bold">Latest Products</h1>

      <ProductList
        title="Newest Arrivals"
        data={sampleData.products}
        limit={4}
      />
    </div>
  );
};

export default HomePage;
