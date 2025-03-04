
import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { CensusDataItem } from "@/types";
import { formatNumber, formatPercent } from "@/utils/format";

interface CensusDataCategoryProps {
  title: string;
  description: string;
  items: CensusDataItem[];
  icon: LucideIcon;
  iconColor: string;
  delay?: number;
}

export const CensusDataCategory = ({ 
  title, 
  description, 
  items, 
  icon: Icon, 
  iconColor,
  delay = 0.5 
}: CensusDataCategoryProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon className={`h-5 w-5 mr-2 ${iconColor}`} />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium">
                  {typeof item.value === 'number' ? 
                    (item.name.toLowerCase().includes('income') ? `$${formatNumber(item.value)}` :
                     item.name.toLowerCase().includes('value') ? `$${formatNumber(item.value)}` :
                     item.name.toLowerCase().includes('percent') ? `${formatPercent(item.value)}%` : 
                     formatNumber(item.value)) 
                    : item.value}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};
