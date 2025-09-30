export default defineAppConfig({
  ui: {
    formField: {
      slots: {
        wrapper: "w-full",
      },
    },
    card: {
      slots: {
        body: "px-2 md:px-8",
      },
      variants: {
        variant: {
          soft: {
            root: "bg-secondary-light/15 dark:bg-secondary-dark/25 backdrop-blur-sm ring-secondary-dark/10 dark:ring-secondary-light/10 shadow-xl rounded-xl",
          },
        },
      },
      defaultVariants: {
        variant: "soft",
      },
    },
    input: {
      slots: {
        root: "w-full",
      },
      variants: {
        variant: {
          outline:
            "shadow-sm bg-secondary-light/20 dark:bg-secondary-dark/20 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400",
        },
      },
      defaultVariants: {
        variant: "outline",
      },
    },
    inputNumber: {
      slots: {
        root: "w-full",
      },
      variants: {
        variant: {
          outline:
            "shadow-sm bg-secondary-light/20 dark:bg-secondary-dark/20 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400",
        },
      },
      defaultVariants: {
        variant: "outline",
      },
    },
    checkbox: {
      slots: {
        base: "ring-2 ring-inset ring-gray-700 dark:ring-gray-200",
        icon: "text-secondary-light",
      },
      variants: {
        variant: {
          outline:
            "shadow-sm ring-2 ring-inset ring-gray-700 dark:ring-gray-200",
        },
        checked: {
          true: "ring ring-accent-3 dark:ring-accent-4",
        },
      },

      defaultVariants: {
        variant: "outline",
      },
    },
    textarea: {
      slots: {
        root: "w-full",
      },
      variants: {
        variant: {
          outline:
            "shadow-sm bg-secondary-light/20 dark:bg-secondary-dark/20 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400",
        },
      },
      defaultVariants: {
        variant: "outline",
      },
    },
    select: {
      slots: {
        // base: "min-w-sm",
      },
      variants: {
        variant: {
          outline:
            "shadow-sm bg-secondary-light/20 dark:bg-secondary-dark/20 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400",
        },
      },
      defaultVariants: {
        variant: "outline",
      },
    },
    selectMenu: {
      slots: {
        // base: "min-w-sm",
      },
      variants: {
        variant: {
          outline:
            "shadow-sm bg-secondary-light/20 dark:bg-secondary-dark/20 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400",
        },
      },
      defaultVariants: {
        variant: "outline",
      },
    },
    slideover: {
      slots: {
        content:
          "bg-secondary-light/15 dark:bg-secondary-dark/25 backdrop-blur-sm",
      },
      variants: {
        side: {
          left: {
            content: "max-w-[45vw] md:max-w-[20vw]",
          },
        },
      },
      // background: "bg-secondary-light dark:bg-secondary-dark",
      //   // divide: "",
      //   // ring: "",
      //   // shadow: "shadow-xl",
      // width: "max-w-[45vw] md:max-w-[20vw]",
    },
    dropdown: {
      background: "bg-secondary-light dark:bg-secondary-dark",
      shadow: "shadow-md",
    },
    modal: {
      variants: {
        fullscreen: {
          false: {
            content: "max-w-[95vw] md:max-w-[80vw]",
          },
        },
      },
    },
    container: {
      constrained: "max-w-10xl",
    },
    navigationMenu: {
      variants: {
        highlightColor: {
          primary:
            "text-accent-2 dark:text-accent-1 bg-accent-2/20 dark:bg-accent-2/30",
        },
      },
    },
    button: {
      variants: {
        variant: {
          outline:
            "bg-transparent dark:bg-transparent border border-(--ui-bg-inverted)",
        },
      },
    },
    breadcrumb: {
      active: "text-accent-2 dark:text-accent-1",
    },
    badge: {
      color: {
        primary: {
          solid:
            "bg-accent-2 text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400",
        },
      },
    },
    table: {
      variants: {
        pinned: {
          true: {
            th: "sticky bg-(--ui-bg) data-[pinned=left]:left-0 data-[pinned=right]:right-0 backdrop-blur-md",
            td: "sticky bg-(--ui-bg) data-[pinned=left]:left-0 data-[pinned=right]:right-0 backdrop-blur-md",
          },
        },
      },
    },
  },
  toaster: {
    position: "top-center" as "top-center",
  },
});
