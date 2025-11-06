import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integration/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Calendar, ShoppingBag, MessageSquare, LogOut } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Add isAdmin state
  const [stats, setStats] = useState({
    products: 0,
    reviews: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    await fetchStats(session.user.id);
    await checkAdminStatus(session.user.id); // Check admin status
  };

  const fetchStats = async (userId: string) => {
    const [productsResult, reviewsResult] = await Promise.all([
      supabase.from("products").select("id", { count: 'exact' }).eq("created_by", userId),
      supabase.from("reviews").select("id", { count: 'exact' }).eq("user_id", userId),
    ]);

    setStats({
      products: productsResult.count || 0,
      reviews: reviewsResult.count || 0,
    });

    setLoading(false);
  };

  // Function to check admin status
  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">Manage your account and view your activity</p>
          </div>

          <div className="grid gap-6">
            {/* Account Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>Your personal details and account info</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email Address</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>Your contributions to TrustShop</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                      <p className="text-sm font-medium">Products Listed</p>
                    </div>
                    <p className="text-3xl font-bold">{stats.products}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-5 w-5 text-accent" />
                      <p className="text-sm font-medium">Reviews Written</p>
                    </div>
                    <p className="text-3xl font-bold">{stats.reviews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAdmin && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => navigate("/add-product")}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Add New Product
                  </Button>
                )}
                <Button 
                  variant="destructive" 
                  className="w-full justify-start" 
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;