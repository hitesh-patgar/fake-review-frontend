import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ReviewCard } from "@/components/ReviewCard";
import { BackToTop } from "@/components/BackToTop";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integration/client";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2, Heart, Share2, ShoppingCart, TrendingUp, ShieldCheck } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import type { User } from "@supabase/supabase-js";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  is_fake: boolean;
  confidence_score: number;
  created_at: string;
  user_id: string;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { isInWishlist, toggleWishlist } = useWishlist();

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";
  const genuineReviews = reviews.filter((r) => !r.is_fake).length;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast({
        variant: "destructive",
        title: "Error loading product",
      });
      navigate("/");
      return;
    }

    setProduct(data);
    setLoading(false);
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (data) {
      setReviews(data);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please login to submit a review",
      });
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    console.log("Starting review submission...");

    try {
      // Call edge function to detect fake review
      console.log("Invoking detect-fake-review edge function...");
      const { data: predictionData, error: functionError } = await supabase.functions.invoke(
        "detect-fake-review",
        {
          body: { review: comment },
        }
      );
      console.log("Edge function invocation complete.", { predictionData, functionError });

      if (functionError) {
        throw functionError;
      }

      const isFake = predictionData?.label === "fake";

      // Insert review into database
      console.log("Inserting review into database...");
      const { error: insertError } = await supabase.from("reviews").insert({
        product_id: id,
        user_id: user.id,
        rating,
        comment,
        is_fake: isFake,
        confidence_score: 0.85, // Default confidence
      });
      console.log("Review insertion complete.", { insertError });

      if (insertError) throw insertError;

      toast({
        title: "Review submitted successfully!",
        description: isFake 
          ? "Your review has been flagged for verification." 
          : "Thank you for your genuine review!",
      });

      setComment("");
      setRating(5);
      fetchReviews();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error submitting review",
        description: error.message,
      });
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Product not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-fade-in">
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl shadow-2xl">
              <img 
                src={product.image_url || "/placeholder.svg"} 
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-2">
                {product.category}
              </Badge>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {product.name}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(Number(avgRating))
                        ? "fill-warning text-warning"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold">{avgRating}</span>
              <span className="text-muted-foreground">({reviews.length} reviews)</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-5 w-5 text-success" />
              <span className="text-muted-foreground">
                {genuineReviews} of {reviews.length} verified genuine reviews
              </span>
            </div>

            <div className="flex items-baseline gap-4">
              <p className="text-5xl font-bold text-primary">${product.price}</p>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                Best Seller
              </Badge>
            </div>

            <p className="text-muted-foreground leading-relaxed text-lg">
              {product.description}
            </p>

            <div className="flex gap-3">
              <Button size="lg" className="flex-1">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => product.id && toggleWishlist(product.id)}
              >
                <Heart
                  className={`h-5 w-5 ${
                    product.id && isInWishlist(product.id)
                      ? "fill-destructive text-destructive"
                      : ""
                  }`}
                />
              </Button>
              <Button size="lg" variant="outline">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </div>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex gap-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRating(i + 1)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors ${
                              i < rating 
                                ? "fill-warning text-warning" 
                                : "text-muted hover:text-warning/50"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="comment">Your Review</Label>
                    <Textarea
                      id="comment"
                      placeholder="Share your experience with this product..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                      rows={5}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting || !user}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing & Submitting...
                      </>
                    ) : !user ? (
                      "Login to Review"
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <BackToTop />
      <Footer />
    </div>
  );
};

export default ProductDetail;