'use client'
import React, { memo, SVGProps, useEffect, useMemo, useState } from 'react'

interface StringToSVGProps extends SVGProps<SVGSVGElement> {
  svgString: string
  fallback?: React.ReactNode
  inheritColor?: boolean
}

/**
 * StringToSVG component that renders an SVG from a string with React props support
 * Performance optimized with useMemo to avoid re-parsing on every render
 * Security enhanced with proper sanitization to prevent XSS attacks
 * By default, SVGs will inherit the text color to ensure visibility when theme changes
 */
const StringToSVG = memo(
  ({ svgString, fallback, inheritColor = true, ...props }: StringToSVGProps) => {
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
          return regexBasedSanitize(svgString, inheritColor)
        }

        // Client-side - use DOM-based sanitization
        return domBasedSanitize(svgString, inheritColor)
      } catch (error) {
        console.error('Error sanitizing SVG:', error)
        setHasError(true)
        return { attributesObj: {}, innerContent: '' }
      }
    }, [svgString, isMounted, inheritColor]) // Re-run if svgString, isMounted, or inheritColor changes

    // If there was an error or no content, show fallback if provided
    if (hasError || (!innerContent && fallback)) {
      return <>{fallback}</>
    }

    // Prepare default SVG attributes that can be overridden by props
    const svgAttributes = {
      ...attributesObj,
      ...(inheritColor && { stroke: 'currentColor' }),
      ...props,
    }

    // Render the SVG with the extracted attributes and content
    return (
      <svg
        {...svgAttributes}
        dangerouslySetInnerHTML={{ __html: innerContent }}
        style={{
          ...props.style,
          display: 'block', // Ensures the SVG takes full space
          // Only apply these styles if width/height are not explicitly provided in props
          ...(props.width === undefined && { width: '100%' }),
          ...(props.height === undefined && { height: '100%' }),
          padding: '0.1em', // Small padding to prevent cropping
          boxSizing: 'border-box',
        }}
        preserveAspectRatio="xMidYMid meet" // Ensures SVG is centered and fully visible
      />
    )
  },
)

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
  'overflow', // Add overflow attribute to allowed list
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
  // 'title',
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
function regexBasedSanitize(svgString: string, inheritColor = false) {
  try {
    // Extract the SVG tag and its attributes using regex
    const svgTagMatch = svgString.match(/<svg[^>]*>/i)
    if (!svgTagMatch) {
      throw new Error('Invalid SVG: No opening svg tag found')
    }

    // Extract viewBox if it exists
    let viewBox = svgTagMatch[0].match(/viewBox=["']([^"']*)["']/i)?.[1] || ''

    // If no viewBox is present, try to create one from width and height
    if (!viewBox) {
      const width = svgTagMatch[0].match(/width=["']([^"']*)["']/i)?.[1]
      const height = svgTagMatch[0].match(/height=["']([^"']*)["']/i)?.[1]

      if (width && height) {
        // Create viewBox from width and height, adding small padding
        const widthValue = parseFloat(width)
        const heightValue = parseFloat(height)
        if (!isNaN(widthValue) && !isNaN(heightValue)) {
          // Add a small padding (5%) to prevent cropping
          const padding = Math.max(widthValue, heightValue) * 0.05
          viewBox = `-${padding} -${padding} ${widthValue + padding * 2} ${heightValue + padding * 2}`
        }
      }
    } else {
      // Add padding to existing viewBox
      const viewBoxValues = viewBox.split(/\s+/).map(parseFloat)
      if (viewBoxValues.length === 4 && !viewBoxValues.some(isNaN)) {
        const x = viewBoxValues[0] || 0
        const y = viewBoxValues[1] || 0
        const width = viewBoxValues[2] || 0
        const height = viewBoxValues[3] || 0
        const padding = Math.max(width, height) * 0.05
        viewBox = `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`
      }
    }

    // Extract all attributes from the SVG tag
    const attributesString = svgTagMatch[0].match(/<svg\s+([^>]*)>/i)?.[1] || ''
    const attributesObj: Record<string, string> = {}
    const attributeRegex = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|\s*\/?[>"']))+.)["']?/gi
    let match

    while ((match = attributeRegex.exec(attributesString)) !== null) {
      // Ensure we have valid strings for name and value
      if (match.length >= 3) {
        const name = match[1] || ''
        const value = match[2] || ''

        if (name && value) {
          // Convert kebab-case to camelCase for React
          const camelCaseName = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())

          // Only include safe attributes
          if (isSafeAttribute(name, value)) {
            // Apply color inheritance if enabled
            if (inheritColor && (name === 'fill' || name === 'stroke')) {
              attributesObj[camelCaseName] = 'currentColor'
            } else {
              attributesObj[camelCaseName] = value
            }
          }
        }
      }
    }

    // Add the viewBox if we created or modified one
    if (viewBox && !attributesObj.viewBox) {
      attributesObj.viewBox = viewBox
    }

    // Add overflow visible to prevent cropping
    attributesObj.overflow = 'visible'

    // Extract inner content (everything between opening and closing svg tags)
    let innerContent = ''
    const contentMatch = svgString.match(/<svg[^>]*>([\s\S]*)<\/svg>/i)

    if (contentMatch && contentMatch[1]) {
      innerContent = contentMatch[1]

      // Apply color inheritance to inner elements if enabled
      if (inheritColor) {
        // Replace fill and stroke attributes with currentColor
        innerContent = innerContent.replace(
          /fill=["'](?!none)([^"']*)["']/gi,
          'fill="currentColor"',
        )
        innerContent = innerContent.replace(
          /stroke=["'](?!none)([^"']*)["']/gi,
          'stroke="currentColor"',
        )
      }

      // Sanitize inner content by removing disallowed tags
      const allowedTagsPattern = ALLOWED_TAGS.join('|')
      const tagRegex = new RegExp(`<(?!\\/?(${allowedTagsPattern})\\b)[^>]+>`, 'gi')
      innerContent = innerContent.replace(tagRegex, '')
    }

    return { attributesObj, innerContent }
  } catch (error) {
    throw error
  }
}

/**
 * Sanitizes an SVG string using DOM methods (client-side only)
 */
function domBasedSanitize(svgString: string, inheritColor = false) {
  // Create a temporary DOM element to parse the SVG
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgString, 'image/svg+xml')

  // Check for parsing errors
  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    throw new Error('SVG parsing error: ' + parserError.textContent)
  }

  // Get the SVG element
  const svgElement = doc.querySelector('svg')
  if (!svgElement) {
    throw new Error('No SVG element found')
  }

  // Extract all attributes from the SVG element
  const attributesObj: Record<string, string> = {}
  Array.from(svgElement.attributes).forEach((attr) => {
    if (isSafeAttribute(attr.name, attr.value)) {
      attributesObj[attr.name] = attr.value
    }
  })

  // Handle viewBox - if missing, create one from width and height
  if (!attributesObj.viewBox) {
    const width = attributesObj.width ? parseFloat(attributesObj.width) : 0
    const height = attributesObj.height ? parseFloat(attributesObj.height) : 0

    if (width && height && !isNaN(width) && !isNaN(height)) {
      // Add a small padding (5%) to prevent cropping
      const padding = Math.max(width, height) * 0.05
      attributesObj.viewBox = `-${padding} -${padding} ${width + padding * 2} ${height + padding * 2}`
    }
  } else {
    // Add padding to existing viewBox
    const viewBoxValues = attributesObj.viewBox.split(/\s+/).map(parseFloat)
    if (viewBoxValues.length === 4 && !viewBoxValues.some(isNaN)) {
      const x = viewBoxValues[0] || 0
      const y = viewBoxValues[1] || 0
      const width = viewBoxValues[2] || 0
      const height = viewBoxValues[3] || 0
      const padding = Math.max(width, height) * 0.05
      attributesObj.viewBox = `${x - padding} ${y - padding} ${width + padding * 2} ${height + padding * 2}`
    }
  }

  // Add overflow visible to prevent cropping
  attributesObj.overflow = 'visible'

  // Apply color inheritance to inner elements if enabled
  if (inheritColor) {
    // Apply currentColor to all elements with fill or stroke
    const elementsWithFill = svgElement.querySelectorAll('[fill]:not([fill="none"])')
    const elementsWithStroke = svgElement.querySelectorAll('[stroke]:not([stroke="none"])')

    elementsWithFill.forEach((el) => el.setAttribute('fill', 'currentColor'))
    elementsWithStroke.forEach((el) => el.setAttribute('stroke', 'currentColor'))
  }

  // Sanitize by removing disallowed tags
  const allElements = svgElement.getElementsByTagName('*')
  for (let i = allElements.length - 1; i >= 0; i--) {
    const element = allElements[i]
    if (element && !ALLOWED_TAGS.includes(element.tagName.toLowerCase())) {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    }
  }

  // Get the sanitized inner content
  const innerContent = Array.from(svgElement.childNodes)
    .map((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        return (node as Element).outerHTML
      }
      return node.textContent || ''
    })
    .join('')

  return { attributesObj, innerContent }
}

export default StringToSVG
