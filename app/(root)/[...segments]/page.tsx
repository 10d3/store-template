import { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import Link, { type LinkProps } from "next/link";
import { notFound } from "next/navigation";
import type React from "react";

// Custom MDX components with Tailwind styling
const mdxComponents = {
  // Use Next.js Link for anchor tags
  a: (props: LinkProps) => <Link {...props} />,
  // Headings
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mt-8 mb-4 text-4xl font-bold" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mt-6 mb-3 text-3xl font-semibold text-gray-800" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-5 mb-2 text-2xl font-medium text-gray-700" {...props} />
  ),
  // Paragraphs
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-4 text-lg leading-relaxed text-muted-foreground" {...props} />
  ),
  // Lists
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-inside my-4 space-y-1 text-muted-foreground" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-inside my-4 space-y-1 text-muted-foreground" {...props} />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => <li className="mb-1 text-muted-foreground" {...props} />,
  // Horizontal rule
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr className="my-8 border-t border-gray-300 text-muted-foreground" {...props} />
  ),
  // Blockquote (if needed)
  blockquote: (props: React.HTMLAttributes<HTMLElement>) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-muted-foreground" {...props} />
  ),
};

const pages: Record<string, { content: string }> = {
  "/about": {
    content: `
# À propos de Nexora

**Nexora** est la nouvelle génération de solutions digitales conçue spécialement pour les entreprises haïtiennes. Nous donnons aux commerçants, aux PME et aux entrepreneurs les outils dont ils ont besoin pour travailler plus vite, vendre plus et gérer leur activité avec précision — le tout à un coût accessible.

Chez **Nexora**, nous croyons qu’un commerce bien organisé peut transformer sa manière de vendre du jour au lendemain. C’est pourquoi nous avons créé une plateforme simple, intuitive et 100 % cloud, qui fonctionne partout en Haïti, sans matériel coûteux, sans complications, et surtout, sans stress.

Nexora, c’est la technologie au service des entrepreneurs haïtiens.

## Mission

Notre mission est claire : **rendre la digitalisation accessible à toutes les entreprises haïtiennes**, petites comme grandes.

Nous aidons les entrepreneurs à :

- gagner du temps,  
- éviter les pertes,  
- encaisser plus rapidement,  
- suivre leurs produits sans erreur,  
- prendre le contrôle total de leur business.

Nous voulons que chaque commerce en Haïti puisse profiter de la puissance d’un système professionnel, sans devoir payer des milliers de dollars.

## Vision

Nous rêvons d’un pays où toutes les PME — du plus petit commerce de quartier à l’hôtel le plus moderne — fonctionnent avec des outils performants, fiables et faciles à utiliser.

Notre vision est de créer **le premier grand écosystème digital haïtien**, capable d’accompagner des milliers d’entrepreneurs dans leur croissance.

Nous voulons bâtir un Haïti où :

- chaque facture est claire,  
- chaque stock est maîtrisé,  
- chaque vente est comptée,  
- chaque entreprise peut se développer avec confiance.

Nexora ne veut pas seulement suivre l’évolution mondiale : **nous voulons donner aux PME haïtiennes les moyens d’en faire partie.**

## Activités

Nexora accompagne les entreprises avec un ensemble complet de services conçus pour simplifier leur quotidien :

### ✔ Solutions de gestion intelligentes
Un système complet de gestion des ventes, facturation, inventaire, réservations, prestations et opérations.  
Adapté à tous les secteurs : restaurants, pharmacies, supermarchés, boutiques, salons, services, hôtels.

### ✔ Formations et accompagnement
Nous formons vos équipes grâce à une plateforme e-learning moderne avec des vidéos, tutoriels, quiz et certifications. Votre équipe devient rapidement autonome et efficace.

### ✔ Support client réactif
WhatsApp, téléphone, visioconférence : nous sommes avec vous à chaque étape. Nous aidons à résoudre les problèmes rapidement pour éviter les interruptions de service.

### ✔ Fourniture de terminaux POS
Nexora propose des machines POS modernes, configurées et prêtes à l’emploi. Encaissements rapides, synchronisation automatique, sécurité renforcée.

### ✔ Sensibilisation & Événements
Workshops, rencontres, cocktails professionnels, ateliers de digitalisation… Nous aidons les entrepreneurs haïtiens à comprendre l’importance de la transformation digitale et à y accéder facilement.
`,
  },
};

export async function generateMetadata(
  props: { params: Promise<{ segments?: string[] }> }
): Promise<Metadata> {
  const params = await props.params;

  if (!params.segments || params.segments.length === 0) {
    return notFound();
  }

  const page = params.segments[0];

  switch (page) {
    case "about":
      return {
        title: "À propos | Nexora",
        description: "Découvrez la vision, la mission et les valeurs de Nexora."
      };

    case "terms":
      return {
        title: "Termes et Services | Nexora",
        description: "Conditions d'utilisation de la plateforme Nexora."
      };

    case "privacy":
    case "privacy":
      return {
        title: "Politique de Confidentialité | Nexora",
        description: "Comment Nexora collecte, utilise et protège vos données."
      };

    case "contact":
      return {
        title: "Contact | Nexora",
        description: "Contactez l'équipe Nexora."
      };

    default:
      return {
        title: "Nexora",
        description: "Solutions digitales pour entreprises haïtiennes."
      };
  }
}

export default async function Page(props: { params: Promise<{ segments?: string[] }> }) {
  const params = await props.params;
  if (!params.segments) {
    return notFound();
  }

  const path = `/${params.segments.join("/")}`;
  const page = pages[path];

  if (!page) {
    return notFound();
  }

  return (
    <div className="max-w-4xl w-full px-4 md:px-0 md:w-3xl mx-auto prose pb-8 pt-24 lg:prose-lg xl:prose-xl">
      <MDXRemote source={page.content} components={mdxComponents} />
    </div>
  );
}
