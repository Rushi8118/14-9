import React from "react";
import { StarRow } from '@/components/ui/star-row'
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";
import { Link } from "react-router-dom";

interface TrustedUsersProps {
  initials: string[];
  rating?: number;
  totalUsersText?: number;
  caption?: string;
  className?: string;
  starColorClass?: string;
  ringColors?: string[];
}

export const TrustedUsers: React.FC<TrustedUsersProps> = ({
  initials,
  rating = 5,
  totalUsersText = 4000,
  caption = "Trusted by",
  className = "",
  starColorClass = "text-yellow-500",
  ringColors = [],
}) => {
  return (
    <div
      className={cn(
        `flex flex-col items-center justify-center gap-4 bg-transparent text-foreground py-6 px-4`,
        className
      )}
    >
      <div className="flex -space-x-3 justify-center">
        {initials.map((init, i) => (
          <div
            key={i}
            className={`relative flex w-12 h-12 shrink-0 items-center justify-center rounded-full bg-background text-primary text-xs font-bold ring-2 ring-offset-2 ring-offset-background transition hover:scale-110 ${ringColors[i] || "ring-primary"
              }`}
          >
            <div className="absolute inset-0 rounded-full bg-primary/10" />
            <span className="relative z-10 text-sm">{init}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <StarRow
          count={rating}
          starClassName="w-5 h-5"
          filledClassName=""
          className={`flex gap-1 justify-center ${starColorClass}`}
        />
        <div className="text-foreground text-sm md:text-base font-semibold">
          <span className="block">
            {caption}{" "}
            <CountUp
              value={totalUsersText}
              duration={2}
              separator=","
              className="font-bold text-primary"
              suffix="+"
            />
          </span>
          <Link to="/reviews" className="text-xs md:text-sm underline text-primary hover:text-primary/80 transition-colors inline-block mt-1">
            successful candidates
          </Link>
        </div>
      </div>
    </div>
  );
};
