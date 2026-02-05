import * as React from "react"

function Card({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card" className={className} {...props}>
      {children}
    </div>
  )
}

function CardHeader({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

function CardTitle({ children, className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3 className={className} {...props}>
      {children}
    </h3>
  )
}

function CardDescription({ children, className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={className} {...props}>
      {children}
    </p>
  )
}

function CardContent({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
