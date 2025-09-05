import CardHero from "@/components/shared/card-hero";
import CardPromo from "@/components/shared/card-promo";
import { FileIcon } from "lucide-react";

export default function ExamplesPage() {
  return (
    <div className="container py-8 space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Description Card */}
        <CardHero
          title="Descripción del producto"
          subtitle="Descubre todos los detalles sobre este increíble producto"
          action={{
            label: "Ver más",
            href: "#"
          }}
          backgroundColor="bg-red-500"
          icon={<FileIcon className="h-8 w-8" />}
        />

        {/* View More Card */}
        <CardHero
          title="Ver más"
          subtitle="Descubre todos los productos"
          action={{
            label: "Explorar",
            href: "/products"
          }}
          backgroundColor="bg-orange-500"
        />

        {/* Promotional Card */}
        <CardPromo
          title="¡En los siguientes productos!"
          discountPercentage={15}
          promoCode="IMBACK"
          backgroundColor="bg-lime-500"
        />

        {/* Custom Card */}
        <CardHero
          title="Personalizado"
          subtitle="Este es un ejemplo de un card personalizado"
          backgroundColor="bg-blue-500"
        >
          <div className="mt-4">
            <p>Contenido personalizado aquí</p>
          </div>
        </CardHero>
      </div>
    </div>
  );
}