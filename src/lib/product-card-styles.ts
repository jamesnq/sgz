import { cn } from './utils'

/**
 * Shared styles for product cards across the application
 * These styles ensure consistent animations and appearance
 */

// Wrapper styles for the card container with padding for hover animation
export const productCardWrapperStyles = 'relative h-full w-full group px-0.5 flex flex-col'

// Base card styles with hover animations
export const productCardStyles =
  'w-full overflow-hidden transition-all duration-300 hover:shadow-md border border-border hover:border group-hover:-translate-y-1 transform-gpu'

// Media container styles
export const productCardMediaContainerStyles = 'relative overflow-hidden'

// Media image styles with hover zoom effect
export const productCardMediaStyles =
  'object-cover transition-transform duration-300 group-hover:scale-110'

// Product name styles with hover color change
export const productCardNameStyles = 'transition-colors duration-300 group-hover:text-primary'

// Price styles with hover color change
export const productCardPriceStyles = 'transition-colors duration-300 group-hover:text-primary/80'

// Discount badge styles with hover animation
export const productCardBadgeStyles =
  'transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3'

// Link styles for product cards
export const productCardLinkStyles = 'transition-all duration-300 hover:border-primary'

/**
 * Function to combine product card styles with custom classes
 */
export function getProductCardStyles(className?: string) {
  return {
    wrapper: cn(productCardWrapperStyles, className),
    card: productCardStyles,
    mediaContainer: productCardMediaContainerStyles,
    media: productCardMediaStyles,
    name: productCardNameStyles,
    price: productCardPriceStyles,
    badge: productCardBadgeStyles,
    link: productCardLinkStyles,
  }
}
