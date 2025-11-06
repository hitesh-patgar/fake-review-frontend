import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ReviewCard } from "@/components/ReviewCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integration/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CheckCircle, ShieldCheck, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface ReviewWithProduct {
  id: string;
  rating: number;
  comment: string;
  is_fake: boolean;
  confidence_score: number;
  created_at: string;
  user_id: string;
  products: {
    name: string;
  };
  profiles?: {
    email: string;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    fake: 0,
    genuine: 0,
  });

  useEffect(() => {
    // checkAuth(); // Temporarily disable auth check for demo purposes
    setLoading(false); // Set loading to false to render content
    setIsAdmin(true); // Assume admin for demo
    fetchReviews();
  }, []);

  const checkAuth = async () => {
    // This function is no longer needed for demo admin access
    // const { data: { session } } = await supabase.auth.getSession();
    
    // if (!session?.user) {
    //   navigate("/auth");
    //   return;
    // }

    // setUser(session.user);

    // const { data: roleData } = await supabase
    //   .from("user_roles")
    //   .select("role")
    //   .eq("user_id", session.user.id)
    //   .eq("role", "admin")
    //   .maybeSingle();

    // if (!roleData) {
    //   navigate("/");
    //   return;
    // }

    // setIsAdmin(true);
    // fetchReviews();
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select(`
        *,
        products (name)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      setReviews(data as ReviewWithProduct[]);
      
      const total = data.length;
      const fake = data.filter(r => r.is_fake).length;
      const genuine = total - fake;
      
      setStats({ total, fake, genuine });
    }

    setLoading(false);
  };

  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting review",
        description: error.message,
      });
    } else {
      toast({
        title: "Review deleted successfully",
      });
      fetchReviews();
    }
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

  if (!isAdmin) {
    return null;
  }

  const fakeReviews = reviews.filter(r => r.is_fake);
  const genuineReviews = reviews.filter(r => !r.is_fake);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Monitor and manage fake review detection
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Reviews</CardDescription>
              <CardTitle className="text-4xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="border-destructive/50">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Fake Reviews
              </CardDescription>
              <CardTitle className="text-4xl text-destructive">{stats.fake}</CardTitle>
            </CardHeader>
          </Card>
          
          <Card className="border-success/50">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Genuine Reviews
              </CardDescription>
              <CardTitle className="text-4xl text-success">{stats.genuine}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Reviews ({stats.total})</TabsTrigger>
            <TabsTrigger value="fake">Fake ({stats.fake})</TabsTrigger>
            <TabsTrigger value="genuine">Genuine ({stats.genuine})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="space-y-2">
                  <p className="text-sm font-medium">
                    Product: {review.products.name}
                  </p>
                  <ReviewCard {...review} showFakeIndicator={true} />
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="fake" className="mt-6">
            <div className="space-y-4">
              {fakeReviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No fake reviews detected
                </p>
              ) : (
                fakeReviews.map((review) => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-medium">
                        Product: {review.products.name}
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                    <ReviewCard {...review} showFakeIndicator={true} />
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="genuine" className="mt-6">
            <div className="space-y-4">
              {genuineReviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No genuine reviews yet
                </p>
              ) : (
                genuineReviews.map((review) => (
                  <div key={review.id} className="space-y-2">
                    <p className="text-sm font-medium">
                      Product: {review.products.name}
                    </p>
                    <ReviewCard {...review} showFakeIndicator={true} />
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;