export const designTokens = {
  colors: {
    // Budget specific colors
    "budget-green": "hsl(142, 76%, 36%)",
    "budget-amber": "hsl(43, 96%, 56%)",
    "budget-red": "hsl(0, 84%, 60%)",

    // Primary palette
    "primary-hue": "hsl(221, 83%, 53%)",
    "accent-hue": "hsl(210, 40%, 96%)",

    // Semantic colors
    success: "hsl(142, 76%, 36%)",
    warning: "hsl(43, 96%, 56%)",
    error: "hsl(0, 84%, 60%)",
    info: "hsl(221, 83%, 53%)",
  },

  spacing: {
    "grid-unit": "8px", // 8pt grid system
    "container-padding": "24px",
    "section-gap": "32px",
    "component-gap": "16px",
  },

  sizing: {
    "modal-max-width": "560px",
    "wizard-max-width": "600px",
    "input-height": "44px",
    "button-height": "40px",
  },

  radius: {
    sm: "calc(var(--radius) - 4px)",
    md: "calc(var(--radius) - 2px)",
    lg: "var(--radius)",
    xl: "calc(var(--radius) + 4px)",
  },

  motion: {
    // Easing curves
    "spring-medium": "cubic-bezier(0.33, 1, 0.68, 1)",
    "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
    "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",

    // Durations
    "duration-fast": "150ms",
    "duration-normal": '200ms",0,0.2,1)',

    // Durations
    "duration-fast": "150ms",
    "duration-normal": "200ms",
    "duration-slow": "300ms",
    "duration-slower": "500ms",
  },

  typography: {
    "font-family-heading": "Inter, system-ui, sans-serif",
    "font-family-body": "Inter, system-ui, sans-serif",
    "font-family-mono": "JetBrains Mono, monospace",

    // Font weights
    "font-weight-normal": "400",
    "font-weight-medium": "500",
    "font-weight-semibold": "600",
    "font-weight-bold": "700",

    // Line heights
    "line-height-tight": "1.25",
    "line-height-normal": "1.5",
    "line-height-relaxed": "1.75",
  },

  shadows: {
    "elevation-1": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    "elevation-2": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    "elevation-3": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    "elevation-4": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },

  breakpoints: {
    mobile: "640px",
    tablet: "768px",
    desktop: "1024px",
    wide: "1280px",
  },

  accessibility: {
    "focus-ring": "2px solid hsl(var(--ring))",
    "focus-offset": "2px",
    "min-touch-target": "44px",
    "contrast-ratio": "4.5", // WCAG AA compliance
  },
}

export type DesignTokens = typeof designTokens

// CSS Custom Properties for runtime theme switching
export const cssVariables = {
  // Color tokens
  "--color-budget-green": designTokens.colors["budget-green"],
  "--color-budget-amber": designTokens.colors["budget-amber"],
  "--color-budget-red": designTokens.colors["budget-red"],
  "--color-primary-hue": designTokens.colors["primary-hue"],
  "--color-accent-hue": designTokens.colors["accent-hue"],

  // Spacing tokens
  "--size-grid-unit": designTokens.spacing["grid-unit"],
  "--size-container-padding": designTokens.spacing["container-padding"],
  "--size-section-gap": designTokens.spacing["section-gap"],
  "--size-component-gap": designTokens.spacing["component-gap"],

  // Radius tokens
  "--size-radius-sm": designTokens.radius.sm,
  "--size-radius-md": designTokens.radius.md,
  "--size-radius-lg": designTokens.radius.lg,
  "--size-radius-xl": designTokens.radius.xl,

  // Motion tokens
  "--motion-spring-medium": designTokens.motion["spring-medium"],
  "--motion-ease-out": designTokens.motion["ease-out"],
  "--motion-ease-in-out": designTokens.motion["ease-in-out"],
  "--motion-duration-fast": designTokens.motion["duration-fast"],
  "--motion-duration-normal": designTokens.motion["duration-normal"],
  "--motion-duration-slow": designTokens.motion["duration-slow"],
}

// Utility function to inject CSS variables
export function injectDesignTokens() {
  if (typeof document !== "undefined") {
    const root = document.documentElement
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })
  }
}
// v0-block-end
