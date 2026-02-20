import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8", 
        default: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
        "2xl": "h-20 w-20",
        "3xl": "h-24 w-24",
      },
      ring: {
        none: "",
        default: "ring-2 ring-background ring-offset-2",
        primary: "ring-2 ring-primary ring-offset-2",
        success: "ring-2 ring-success ring-offset-2",
        warning: "ring-2 ring-warning ring-offset-2",
        error: "ring-2 ring-error ring-offset-2",
        online: "ring-2 ring-green-500 ring-offset-2",
        offline: "ring-2 ring-gray-400 ring-offset-2",
      },
      status: {
        none: "",
        online: "after:absolute after:bottom-0 after:right-0 after:h-3 after:w-3 after:rounded-full after:bg-green-500 after:ring-2 after:ring-background",
        offline: "after:absolute after:bottom-0 after:right-0 after:h-3 after:w-3 after:rounded-full after:bg-gray-400 after:ring-2 after:ring-background",
        busy: "after:absolute after:bottom-0 after:right-0 after:h-3 after:w-3 after:rounded-full after:bg-red-500 after:ring-2 after:ring-background",
        away: "after:absolute after:bottom-0 after:right-0 after:h-3 after:w-3 after:rounded-full after:bg-yellow-500 after:ring-2 after:ring-background",
      },
    },
    defaultVariants: {
      size: "default",
      ring: "none",
      status: "none",
    },
  }
)

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  fallback?: string
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, ring, status, src, alt, fallback, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size, ring, status }), className)}
    {...props}
  >
    <AvatarImage src={src} alt={alt} />
    <AvatarFallback>{fallback}</AvatarFallback>
  </AvatarPrimitive.Root>
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground font-medium",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Specialized Avatar Group Component
interface AvatarGroupProps {
  avatars: Array<{
    src?: string
    alt?: string
    fallback?: string
  }>
  max?: number
  size?: VariantProps<typeof avatarVariants>['size']
  className?: string
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({ 
  avatars, 
  max = 5, 
  size = "default",
  className 
}) => {
  const displayedAvatars = avatars.slice(0, max)
  const remainingCount = Math.max(0, avatars.length - max)
  
  return (
    <div className={cn("flex -space-x-2", className)}>
      {displayedAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          size={size}
          ring="default"
          src={avatar.src}
          alt={avatar.alt}
          fallback={avatar.fallback}
          className="border-2 border-background hover:z-10 transition-all duration-200"
        />
      ))}
      {remainingCount > 0 && (
        <Avatar
          size={size}
          ring="default"
          className="border-2 border-background bg-muted hover:z-10 transition-all duration-200"
          fallback={`+${remainingCount}`}
        />
      )}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup }