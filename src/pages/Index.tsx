import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { BackToTop } from "@/components/BackToTop";
import { supabase } from "@/integration/client";
import { Loader2, Heart, TrendingUp, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWishlist } from "@/hooks/useWishlist";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const { wishlist } = useWishlist();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const filteredAndSortedProducts = products
    .filter((p) => {
      if (filter === "all") return true;
      if (filter === "wishlist") return wishlist.includes(p.id);
      return p.category.toLowerCase() === filter.toLowerCase();
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Browse Products
          </h1>
          <p className="text-muted-foreground text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            All reviews are analyzed using AI to detect fake reviews
          </p>
        </div>

        {wishlistProducts.length > 0 && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 fill-destructive text-destructive" />
              <h2 className="text-2xl font-bold">Your Wishlist</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {wishlistProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Products" : cat === "wishlist" ? "❤️ Wishlist" : cat}
                  </SelectItem>
                ))}
                <SelectItem value="wishlist">❤️ Wishlist ({wishlist.length})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="name">Name: A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product, index) => (
              <div
                key={product.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fade-in"
              >
                <ProductCard {...product} />
              </div>
            ))}
          </div>
        )}
      </main>
      <BackToTop />
      <Footer />
    </div>
  );
};

export default Index;