import React from "react";

type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-[6px] border border-white/10 bg-[#4b1927]/35 shadow-[0_10px_25px_rgba(0,0,0,0.25)] ${
        className ?? ""
      }`}
    />
  );
}
