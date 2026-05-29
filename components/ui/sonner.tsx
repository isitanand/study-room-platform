"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg":        "#ffffff",
          "--normal-text":      "#141414",
          "--normal-border":    "#e7e7e7",

          "--success-bg":       "#ffffff",
          "--success-text":     "#141414",
          "--success-border":   "#0A7C6E",

          "--info-bg":          "#ffffff",
          "--info-text":        "#141414",
          "--info-border":      "#0A7C6E",

          "--warning-bg":       "#ffffff",
          "--warning-text":     "#141414",
          "--warning-border":   "#d97706",

          "--error-bg":         "#ffffff",
          "--error-text":       "#141414",
          "--error-border":     "#cc3737",

          "--border-radius":    "8px",
          "--toast-shadow":     "0 4px 12px rgba(0,0,0,0.08)",

          "--success-icon":     "#0A7C6E",
          "--info-icon":        "#0A7C6E",
          "--warning-icon":     "#d97706",
          "--error-icon":       "#cc3737",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:       "cn-toast !font-sans !text-[13px] !shadow-[0_4px_12px_rgba(0,0,0,0.08)] !border",
          title:       "!font-semibold !text-[#141414] !text-[13px]",
          description: "!text-[#737373] !text-[12px]",
          icon:        "!text-[#0A7C6E]",
          actionButton:"!bg-[#0A7C6E] !text-white !rounded-[5px] !text-[12px]",
          cancelButton:"!bg-[#f4eee5] !text-[#141414] !rounded-[5px] !text-[12px]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
