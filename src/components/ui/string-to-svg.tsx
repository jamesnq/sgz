'use client'
import React, { memo, SVGProps, useMemo, useEffect, useState } from 'react'

interface StringToSVGProps extends SVGProps<SVGSVGElement> {
  svgString: string
  fallback?: React.ReactNode
}

/**
 * StringToSVG component that renders an SVG from a string with React props support
 * Performance optimized with useMemo to avoid re-parsing on every render
 * Security enhanced with proper sanitization to prevent XSS attacks
 */
const StringToSVG = memo(({ svgString, fallback, ...props }: StringToSVGProps) => {
  // State to track if we're in the browser
  const [isMounted, setIsMounted] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Set mounted state when component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Memoize the SVG parsing to avoid unnecessary re-processing on every render
  const { attributesObj, innerContent } = useMemo(() => {
    // Handle empty or invalid SVG strings
    if (!svgString || typeof svgString !== 'string') {
      return { attributesObj: {}, innerContent: '' }
    }

    try {
      // Server-side or initial render - use regex-based sanitization
      if (!isMounted) {
        return regexBasedSanitize(svgString)
      }

      // Client-side - use DOM-based sanitization
      return domBasedSanitize(svgString)
    } catch (error) {
      console.error('Error sanitizing SVG:', error)
      setHasError(true)
      return { attributesObj: {}, innerContent: '' }
    }
  }, [svgString, isMounted]) // Re-run if svgString or isMounted changes

  // If there was an error or no content, show fallback if provided
  if (hasError || (!innerContent && fallback)) {
    return <>{fallback}</>
  }

  // Render the SVG with the extracted attributes and content
  return (
    <svg {...attributesObj} dangerouslySetInnerHTML={{ __html: innerContent }} {...props} />
  )
})

// Add display name to the component to fix the lint error
StringToSVG.displayName = 'StringToSVG'

/**
 * List of allowed SVG attributes that are considered safe
 */
const ALLOWED_ATTRIBUTES = [
  'viewBox',
  'xmlns',
  'width',
  'height',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'role',
  'd',
  'cx',
  'cy',
  'r',
  'x',
  'y',
  'transform',
  'style',
  'text-anchor',
  'font-size',
  'font-family',
  'font-weight',
  'points',
  'dx',
  'dy',
  'version',
  'baseProfile',
  'class',
  'id',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'fill-rule',
  'stroke-dasharray',
  'stroke-dashoffset',
  'dominant-baseline',
  'clip-path',
  'mask',
  'marker-start',
  'marker-mid',
  'marker-end',
  'filter',
  'clip-rule',
  'pathLength',
  'preserveAspectRatio',
]

/**
 * List of allowed SVG tags that are considered safe
 */
const ALLOWED_TAGS = [
  'svg',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'g',
  'text',
  'tspan',
  'title',
  'desc',
  'defs',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
  'mask',
  'pattern',
  'use',
  'symbol',
  'marker',
  'filter',
  'feGaussianBlur',
  'feOffset',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
]

/**
 * Checks if an attribute is safe to use
 */
function isSafeAttribute(name: string, value: string): boolean {
  // Check if the attribute name is in our whitelist
  if (!ALLOWED_ATTRIBUTES.includes(name)) {
    return false
  }

  // Extra check for potentially dangerous values
  if (
    value.includes('javascript:') || 
    value.includes('data:') || 
    value.includes('vbscript:') ||
    value.includes('expression(') ||
    /url\s*\(\s*['"]?\s*data:/i.test(value)
  ) {
    return false
  }

  // Check for event handlers (on*)
  if (name.startsWith('on')) {
    return false
  }

  // Special handling for style attribute to prevent CSS-based attacks
  if (name === 'style') {
    // Check for potentially dangerous CSS
    if (
      value.includes('expression') ||
      value.includes('url(') ||
      value.includes('@import') ||
      value.includes('behavior')
    ) {
      return false
    }
  }

  return true
}

/**
 * Sanitizes an SVG string using regex (safe for server-side rendering)
 */
function regexBasedSanitize(svgString: string) {
  if (!svgString) {
    return { attributesObj: {}, innerContent: '' }
  }

  // Use a simple regex to extract just the inner content of the SVG
  const innerMatch = svgString.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)
  const innerContent = innerMatch ? innerMatch[1] : ''

  // Use another regex to extract the attributes of the SVG tag
  const svgTagMatch = svgString.match(/<svg([^>]*)>/)
  const svgAttributes = svgTagMatch ? svgTagMatch[1] : ''

  // Parse the attributes into a key-value object
  const attributesObj: Record<string, string> = {}
  if (svgAttributes) {
    const attributeMatches = svgAttributes.matchAll(/(\w+)=["']([^"']*)["']/g)
    for (const match of Array.from(attributeMatches)) {
      if (match[1] && match[2]) {
        const attrName = match[1]
        const attrValue = match[2]

        // Only allow safe attributes
        if (isSafeAttribute(attrName, attrValue)) {
          attributesObj[attrName] = attrValue
        }
      }
    }
  }

  // Filter out script tags and other potentially dangerous content
  const safeInnerContent = innerContent
    ? innerContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
        .replace(/on\w+='[^']*'/gi, '') // Remove event handlers with single quotes
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/data:\s*[^,]*?script/gi, '') // Remove data: with script MIME type
    : ''

  return { attributesObj, innerContent: safeInnerContent }
}

/**
 * Sanitizes an SVG string using DOM methods (client-side only)
 */
function domBasedSanitize(svgString: string) {
  if (!svgString) {
    return { attributesObj: {}, innerContent: '' }
  }

  // Create a temporary div to use the browser's HTML parser
  const div = document.createElement('div')
  div.innerHTML = svgString.trim()

  // Get the SVG element
  const svg = div.querySelector('svg')
  if (!svg) {
    return { attributesObj: {}, innerContent: '' }
  }

  // Remove any script tags
  const scripts = svg.querySelectorAll('script')
  scripts.forEach((script) => script.remove())

  // Process all elements recursively
  const processNode = (node: Element) => {
    // Remove disallowed tags
    if (!ALLOWED_TAGS.includes(node.tagName.toLowerCase())) {
      node.remove()
      return
    }

    // Remove unsafe attributes
    Array.from(node.attributes).forEach((attr) => {
      if (!isSafeAttribute(attr.name, attr.value)) {
        node.removeAttribute(attr.name)
      }
    })

    // Process children recursively
    Array.from(node.children).forEach(child => {
      processNode(child)
    })
  }

  // Start processing from the SVG element
  processNode(svg)

  // Extract attributes from the SVG element
  const attributesObj: Record<string, string> = {}
  Array.from(svg.attributes).forEach((attr) => {
    if (isSafeAttribute(attr.name, attr.value)) {
      attributesObj[attr.name] = attr.value
    }
  })

  // Get the inner content
  const innerContent = svg.innerHTML || ''

  return { attributesObj, innerContent }
}

export default StringToSVG
