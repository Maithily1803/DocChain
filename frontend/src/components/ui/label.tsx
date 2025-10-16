import * as React from "react"

function Label({ children, className, ...props }: React.ComponentProps<"label">) {
  return (
    <label className={className} {...props}>
      {children}
    </label>
  )
}

export { Label }
