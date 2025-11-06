import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useState } from "react";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
}

export const ProductCard = ({ id, name, description, price, image_url, category }: ProductCardProps) => {
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const inWishlist = isInWishlist(id);

  return (
    <Card 
      className="group overflow-hidden transition-all hover:shadow-xl animate-fade-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={image_url || "/placeholder.svg"} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center gap-2 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(id);
            }}
          >
            <Heart className={`h-5 w-5 ${inWishlist ? 'fill-destructive text-destructive' : ''}`} />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="rounded-full"
            onClick={() => navigate(`/product/${id}`)}
          >
            <Eye className="h-5 w-5" />
          </Button>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(id);
          }}
          className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm transition-all hover:scale-110"
        >
          <Heart className={`h-5 w-5 ${inWishlist ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
        </button>
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-1 text-base">{name}</CardTitle>
            <CardDescription className="mt-1 text-xs">{category}</CardDescription>
          </div>
          <span className="text-xl font-bold text-primary whitespace-nowrap">${price}</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={() => navigate(`/product/${id}`)} className="flex-1" variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
        <Button className="flex-1">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};