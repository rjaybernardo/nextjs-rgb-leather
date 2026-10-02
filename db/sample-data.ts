import { hashSync } from "bcrypt-ts-edge";

const sampleData = {
  users: [
    {
      name: "John",
      email: "admin@example.com",
      password: hashSync("123456", 10),
      role: "admin" as const,
    },
    {
      name: "Jane",
      email: "user@example.com",
      password: hashSync("123456", 10),
      role: "user" as const,
    },
  ],
  // Placeholder catalog: replace with each brand's real products in
  // Admin → Products. Images are neutral placeholders in public/images.
  products: [
    {
      name: "Sample Product 1",
      slug: "sample-product-1",
      category: "Sample Category A",
      description: "A short description of the product: what it is, what it's made of and who it's for.",
      images: [
        "/images/sample-products/p1-1.jpg",
        "/images/sample-products/p1-2.jpg",
      ],
      price: 1299,
      brand: "Sample Brand",
      rating: 4.5,
      numReviews: 10,
      stock: 5,
      isFeatured: true,
      banner: "/images/banner-1.jpg",
    },
    {
      name: "Sample Product 2",
      slug: "sample-product-2",
      category: "Sample Category A",
      description: "A short description of the product: what it is, what it's made of and who it's for.",
      images: [
        "/images/sample-products/p2-1.jpg",
        "/images/sample-products/p2-2.jpg",
      ],
      price: 1899,
      brand: "Sample Brand",
      rating: 4.2,
      numReviews: 8,
      stock: 10,
      isFeatured: true,
      banner: "/images/banner-2.jpg",
    },
    {
      // Out of stock, to show the sold-out state
      name: "Sample Product 3",
      slug: "sample-product-3",
      category: "Sample Category A",
      description: "A short description of the product: what it is, what it's made of and who it's for.",
      images: [
        "/images/sample-products/p3-1.jpg",
        "/images/sample-products/p3-2.jpg",
      ],
      price: 2499,
      brand: "Sample Brand",
      rating: 4.9,
      numReviews: 3,
      stock: 0,
      isFeatured: false,
      banner: null,
    },
    {
      name: "Sample Product 4",
      slug: "sample-product-4",
      category: "Sample Category B",
      description: "A short description of the product: what it is, what it's made of and who it's for.",
      images: [
        "/images/sample-products/p4-1.jpg",
        "/images/sample-products/p4-2.jpg",
      ],
      price: 799,
      brand: "Sample Brand",
      rating: 3.6,
      numReviews: 5,
      stock: 10,
      isFeatured: false,
      banner: null,
    },
    {
      name: "Sample Product 5",
      slug: "sample-product-5",
      category: "Sample Category B",
      description: "A short description of the product: what it is, what it's made of and who it's for.",
      images: [
        "/images/sample-products/p5-1.jpg",
        "/images/sample-products/p5-2.jpg",
      ],
      price: 1599,
      brand: "Sample Brand",
      rating: 4.7,
      numReviews: 18,
      stock: 6,
      isFeatured: false,
      banner: null,
    },
    {
      name: "Sample Product 6",
      slug: "sample-product-6",
      category: "Sample Category B",
      description: "A short description of the product: what it is, what it's made of and who it's for.",
      images: [
        "/images/sample-products/p6-1.jpg",
        "/images/sample-products/p6-2.jpg",
      ],
      price: 2199,
      brand: "Sample Brand",
      rating: 4.6,
      numReviews: 12,
      stock: 8,
      isFeatured: true,
      banner: null,
    },
  ],
};

export default sampleData;
