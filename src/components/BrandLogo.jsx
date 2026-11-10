import Image from "next/image";

export default function BrandLogo({ name, large = false, compact = false }) {
  return (
    <Image
      src="/brand/housingfinder-wayfinder.webp"
      alt={name}
      width={256}
      height={256}
      unoptimized
      className={`${large ? "size-12" : compact ? "size-8 lg:size-10" : "size-10"} shrink-0 object-contain dark:brightness-0 dark:invert`}
    />
  );
}
