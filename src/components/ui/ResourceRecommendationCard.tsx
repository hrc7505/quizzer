"use client";

import * as React from "react";
import { ExternalLink, BookOpen, GraduationCap, Award, Wrench, Heart } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";
import {
  ResourceRecommendationCardProps,
  SponsoredResourceItem,
  SponsoredResourceType,
} from "@/components/ui/interfaces/ResourceRecommendationCard.interface";
import { getContextualResources } from "@/lib/services/recommendation.service";

/**
 * Returns an appropriate Lucide icon based on the resource type.
 *
 * @param type The type of the sponsored item.
 * @returns React icon element.
 */
function getResourceIcon(type: SponsoredResourceType) {
  switch (type) {
    case "certification":
      return <Award className="h-4 w-4 text-amber-500 shrink-0" />;
    case "course":
      return <GraduationCap className="h-4 w-4 text-primary shrink-0" />;
    case "book":
      return <BookOpen className="h-4 w-4 text-emerald-500 shrink-0" />;
    case "support":
      return <Heart className="h-4 w-4 text-rose-500 shrink-0" />;
    case "tool":
    default:
      return <Wrench className="h-4 w-4 text-sky-500 shrink-0" />;
  }
}

/**
 * Single Resource Card item.
 */
function ResourceItemRow({ item }: { item: SponsoredResourceItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={cn(
        "group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg",
        "border border-border/50 bg-secondary/15 hover:bg-secondary/35 hover:border-primary/30",
        "transition-all duration-200"
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="p-2 rounded-md bg-background border border-border/50 shadow-2xs mt-0.5 sm:mt-0">
          {getResourceIcon(item.type)}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
              {item.title}
            </span>
            {item.badgeText && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                {item.badgeText}
              </Badge>
            )}
            {item.offerText && (
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                {item.offerText}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {item.description}
          </p>
          <span className="text-[11px] text-muted-foreground/75 mt-1 font-mono">
            via {item.provider}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary shrink-0 self-end sm:self-center">
        <span>Explore</span>
        <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </a>
  );
}

/**
 * ResourceRecommendationCard
 * Non-intrusive, curated affiliate & partner resource component designed to generate
 * passive revenue while providing high-value educational recommendations.
 */
export function ResourceRecommendationCard({
  contextTopic,
  customItems,
  title = "Recommended Study Resources & Certifications",
  subtitle = "Curated books, verified exams, and resources to advance your skills.",
  maxItems = 2,
  showDisclaimer = true,
  className,
}: ResourceRecommendationCardProps) {
  const items = React.useMemo(() => {
    if (customItems && customItems.length > 0) return customItems.slice(0, maxItems);
    return getContextualResources(contextTopic, maxItems);
  }, [contextTopic, customItems, maxItems]);

  if (!items || items.length === 0) return null;

  return (
    <Card className={cn("border border-border/60 bg-card/60 backdrop-blur-xs", className)}>
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold text-foreground">
            {title}
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 text-muted-foreground font-normal">
            Partner Pick
          </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          {subtitle}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5 px-5 pb-4">
        {items.map((item) => (
          <ResourceItemRow key={item.id} item={item} />
        ))}

        {showDisclaimer && (
          <p className="text-[10px] text-muted-foreground/60 text-right pt-1">
            Some links support Quizzer through affiliate partnerships at zero extra cost to you.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

