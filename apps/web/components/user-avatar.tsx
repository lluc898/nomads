import Image from "next/image";

type UserAvatarProps = {
  image: string | null;
  name: string | null;
  username?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "size-10 text-sm",
  md: "size-16 text-xl",
  lg: "size-28 text-3xl",
};

const imageSizes = {
  sm: 40,
  md: 64,
  lg: 112,
};

export function UserAvatar({
  image,
  name,
  username,
  size = "md",
}: UserAvatarProps) {
  const accessibleName = username ? `@${username}` : (name ?? "Viajero");
  const initial = (name ?? username ?? "V").trim().charAt(0).toUpperCase();

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-blue-100 font-extrabold text-[#0B6EFD] ring-4 ring-white ${sizeClasses[size]}`}
    >
      {image ? (
        <Image
          src={image}
          alt={`Foto de ${accessibleName}`}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="size-full object-cover"
          unoptimized
        />
      ) : (
        <span
          className="flex size-full items-center justify-center"
          aria-hidden
        >
          {initial}
        </span>
      )}
    </div>
  );
}
