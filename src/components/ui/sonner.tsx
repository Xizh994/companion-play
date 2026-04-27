"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[#1a1a2e border border-[#2d2d44] group-[.toaster]:text-white",
          description: "group-[.toast]:text-gray-400",
          actionButton: "group-[.toast]:bg-pink-500 group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-gray-700 group-[.toast]:text-gray-300",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };