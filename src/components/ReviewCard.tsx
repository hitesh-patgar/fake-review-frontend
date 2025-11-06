import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface ReviewCardProps {
  rating: number;
  comment: string;
  is_fake: boolean;
  confidence_score?: number;
  created_at: string;
  user_email?: string;
  showFakeIndicator?: boolean;
}

export const ReviewCard = ({ 
  rating, 
  comment, 
  is_fake, 
  confidence_score, 
  created_at,
  user_email,
  showFakeIndicator = false 
}: ReviewCardProps) => {
  return (
    <Card className={is_fake && showFakeIndicator ? "border-destructive" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < rating ? "fill-warning text-warning" : "text-muted"
                  }`}
                />
              ))}
            </div>
            {user_email && (
              <p className="text-sm text-muted-foreground mt-1">{user_email}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(created_at), "MMM dd, yyyy")}
            </p>
          </div>
          {showFakeIndicator && (
            <div className="flex items-center gap-2">
              {is_fake ? (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Fake
                </Badge>
              ) : (
                <Badge className="gap-1 bg-success text-success-foreground">
                  <CheckCircle className="h-3 w-3" />
                  Genuine
                </Badge>
              )}
              {confidence_score && (
                <span className="text-xs text-muted-foreground">
                  {(confidence_score * 100).toFixed(0)}%
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{comment}</p>
      </CardContent>
    </Card>
  );
};
