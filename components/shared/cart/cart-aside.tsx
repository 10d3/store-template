import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useCartModal } from "@/context/cart-modal";
import useMediaQuery from "@/hook/useMediaquery";
import { useTranslations } from "next-intl";

export default function CartDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, setIsOpen } = useCartModal();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const t = useTranslations("");
  return (
    <Drawer
      open={isOpen}
      shouldScaleBackground={true}
      direction={isDesktop ? "right" : "bottom"}
    >
      <DrawerTitle className="sr-only">{t("")}</DrawerTitle>
      <DrawerContent
        className="sm:fixed sm:bottom-0 sm:left-auto sm:right-0 sm:top-0 sm:mt-0 sm:flex sm:h-full sm:w-1/2 sm:flex-col sm:overflow-hidden sm:rounded-none sm:bg-white sm:shadow-xl lg:w-1/3"
        aria-describedby="cart-overlay-description"
        onPointerDownOutside={() => {
          setIsOpen(false);
        }}
        onEscapeKeyDown={() => {
          setIsOpen(false);
        }}
      >
        {children}
      </DrawerContent>
    </Drawer>
  );
}
