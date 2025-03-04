
import { School } from "@/types/schools";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarIcon, PhoneIcon, School as SchoolIcon, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SchoolCardProps {
  school: School;
  delay?: number;
}

export const SchoolCard = ({ school, delay = 0 }: SchoolCardProps) => {
  const formatGradeRange = (low: string, high: string) => {
    if (low === high) return `Grade ${low}`;
    return `Grades ${low}-${high}`;
  };

  const getSchoolTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("public")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (lowerType.includes("charter")) return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    if (lowerType.includes("private")) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  };

  const getEducationLevelColor = (level: string) => {
    const lowerLevel = level.toLowerCase();
    if (lowerLevel.includes("elementary")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (lowerLevel.includes("middle")) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    if (lowerLevel.includes("high")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  };

  const renderRatingStars = (rating: number | undefined) => {
    if (!rating) return null;
    const roundedRating = Math.round(rating);
    
    return (
      <div className="flex items-center mt-2">
        {[...Array(5)].map((_, i) => (
          <StarIcon 
            key={i} 
            className={`h-4 w-4 ${i < roundedRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
          />
        ))}
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">{rating}/5</span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
    >
      <Card className="overflow-hidden h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold line-clamp-2">{school.name}</CardTitle>
            {school.location.distanceMiles && (
              <Badge variant="outline" className="ml-2 whitespace-nowrap">
                {school.location.distanceMiles.toFixed(1)} mi
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {school.type && (
              <Badge className={getSchoolTypeColor(school.type)} variant="secondary">
                {school.type}
              </Badge>
            )}
            {school.educationLevel && (
              <Badge className={getEducationLevelColor(school.educationLevel)} variant="secondary">
                {school.educationLevel}
              </Badge>
            )}
          </div>
          {school.ratings?.overall && renderRatingStars(school.ratings.overall)}
        </CardHeader>
        <CardContent className="pt-2 flex-1 flex flex-col justify-between">
          <div>
            <p className="text-sm mb-3">
              {school.grades?.range && formatGradeRange(school.grades.range.low, school.grades.range.high)}
              {school.enrollment && ` · ${school.enrollment.toLocaleString()} students`}
            </p>
            
            <div className="flex items-start gap-1 text-sm text-muted-foreground mb-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p>{school.location.address.streetAddress}</p>
                <p>{school.location.address.city}, {school.location.address.state} {school.location.address.zipCode}</p>
              </div>
            </div>
            
            {school.phone && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <PhoneIcon className="h-4 w-4" />
                <span>{school.phone}</span>
              </div>
            )}
            
            {school.district && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <SchoolIcon className="h-4 w-4" />
                <span>{school.district.name}</span>
              </div>
            )}
          </div>
          
          {school.links?.profile && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => window.open(school.links?.profile, '_blank')}
              >
                View Profile
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
