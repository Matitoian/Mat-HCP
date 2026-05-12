import * as React from "react";
import { VariantProps } from "class-variance-authority";

declare const Button: React.ForwardRefExoticComponent<
  React.ComponentProps<"button"> &
    VariantProps<{
      variant: {
        default: string;
        destructive: string;
        outline: string;
        secondary: string;
        ghost: string;
        link: string;
      };
      size: {
        default: string;
        sm: string;
        lg: string;
        icon: string;
      };
    }>
>;

export { Button };