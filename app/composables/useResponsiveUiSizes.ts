type uiSizes = "xs" | "sm" | "md" | "lg" | "xl";
interface ResponsiveUiSizes {
  button: uiSizes;
  select: uiSizes;
  textarea: uiSizes;
  input: uiSizes;
  card: uiSizes;
  modal: uiSizes;
  image: uiSizes;
  badge: uiSizes;
  icon: uiSizes;
  toggle: uiSizes;
  breadcumb: uiSizes;
}

export const useResponsiveUiSizes = () => {
  const { width } = useWindowSize();

  const screen = computed(() => {
    if (width.value < 640) return "xs";
    if (width.value < 768) return "sm";
    if (width.value < 1024) return "md";
    return "lg";
  });

  let sizes: ResponsiveUiSizes = {
    button: screen.value,
    input: screen.value,
    card: screen.value,
    modal: screen.value,
    select: screen.value,
    textarea: screen.value,
    icon: screen.value,
    toggle: screen.value,
    breadcumb: screen.value,
    image: screen.value === "xs" ? "sm" : screen.value, // Adjust image size for smaller screens
    badge: screen.value === "xs" ? "sm" : screen.value, // Optional badge size, can be adjusted as needed
  };
  return sizes;
};
