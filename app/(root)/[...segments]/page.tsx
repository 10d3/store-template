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
    <h2 className="mt-6 mb-3 text-3xl font-semibold" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-5 mb-2 text-2xl font-medium" {...props} />
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
# Our Mission

To help you reclaim your natural vitality with clean, plant-based support that respects your roots, your rhythm, and your reality.

# Why Vitanou Exists

It began with a question asked repeatedly:  
**“Doctor, is there something natural I can take that doesn’t cause side effects?”**

As a doctor and educator, I’ve spent years explaining how the body works — blood sugar, hormones, sexual health, energy, inflammation. But teaching revealed something deeper:

People were overwhelmed, frustrated, and underserved.  
They needed solutions made **for them**, not generic advice.

So I stopped only teaching… and I started listening.

# What We Heard

We listened to women whose cycles were controlling their lives.  
Men who had lost their energy, confidence, and drive.  
People struggling with high blood sugar, feeling scared and alone.  
Individuals searching for natural solutions that actually help.

Their stories shaped the foundation of **Vitanou**.

# Our Name & Our Promise

**Vitanou** means **“Our Vitality.”**  
It represents health we build together — not alone.

Our promise is simple:

- Clean, plant-based formulas  
- Research-supported ingredients  
- No artificial fillers  
- No exaggerated claims  

Wellness inspired by nature and confirmed by science.

# What We Create

Every product in the Vitanou line has a purpose:

- **Pidjanm** for male vitality and performance  
- **FemmeFlow** for women’s hormonal balance  
- **Blood Sugar Balance** for metabolic support  
- And additional formulas designed to strengthen energy, resilience, and overall well-being  

This isn’t about quick fixes.  
This is meaningful wellness that respects your life.

# How We Work

We blend scientific clarity, cultural understanding, and traditional healing wisdom.  
True health exists where **knowledge**, **nature**, and **experience** meet.

Our approach:

- Educate  
- Empower  
- Support  

# A Wellness Movement

Vitanou is more than a supplement brand.  
It’s a return to what works.  
A reminder to trust nature again — without turning away from science.

A community built on honesty, clarity, and real transformation.

I’m here to guide you.  
I’m here to walk this journey with you.

# We Are Life, We Are Health
`,
  },
  "/privacy": {
    content: `
# Privacy Policy for Vitanou.com

**Effective Date:** June 03, 2025  
**Website:** Vitanou.com  
**Operator:** AnandarCompany LLC  
**Address:** 203 Seneca Trail, Louisville, KY 40214  
**Email:** contact@vitanou.com

At **Vitanou.com**, your privacy is our priority. This Privacy Policy explains how your personal data is collected, used, and protected when you interact with our website and services.

By using our website, you agree to the terms described in this policy.

## 1. Who We Are
- Website: Vitanou.com  
- Business Name: AnandarCompany LLC  
- Address: 203 Seneca Trail, Louisville, KY 40214  
- Email: contact@vitanou.com  

## 2. Information We Collect

### Personal Information
- Name  
- Email address  
- Billing and shipping addresses  
- Phone number  
- Payment details  

### Non-Personal Information
- Browser type and version  
- IP address  
- Time zone and language settings  
- Device type and operating system  
- Pages visited and time spent on the site  

## 3. How We Use Your Information
We use your information to:
- Process and fulfill orders  
- Provide customer support  
- Improve user experience and site performance  
- Comply with legal requirements  

## 4. Sharing Your Information
We do **not** sell your data.  
Information may be shared only with:
- Service providers (payment processors, logistics, etc.)  
- Authorities when legally required  

## 5. Cookies and Tracking
We use cookies to enhance your experience. You may manage cookie settings in your browser.

## 6. Data Retention
Data is stored as long as needed for business operations and legal obligations.

## 7. Your Rights
Contact us to request:
- Access to your data  
- Corrections  
- Deletion  

## 8. Security
Although we use secure systems, no online method is 100% guaranteed.

## 9. Third-Party Services
We are not responsible for external websites linked from ours.

## 10. Children’s Privacy
We do not knowingly collect data from children under 13.

## 11. Changes to this Policy
Updates will be posted on this page.

## 12. Contact
Email: contact@vitanou.com  
Address: 203 Seneca Trail, Louisville, KY 40214
    `,
  },
  "/terms": {
    content: `
# Terms and Conditions – Vitanou.com

**Effective Date:** June 03, 2025

Welcome to **Vitanou.com**. By accessing or making a purchase on our website, you agree to the following Terms and Conditions.

## 1. Eligibility
You must be at least **18 years old** to use this website.

## 2. Products and Medical Disclaimer
Our supplements are **not** intended to diagnose, treat, cure, or prevent any disease.  
Consult a healthcare professional before using any supplement.

## 3. Orders and Payment
- We may refuse or cancel orders at our discretion.  
- All payments must be completed securely.

## 4. Shipping and Delivery
- Orders are processed within 1–3 business days.  
- We are not responsible for delays or lost packages once shipped.

## 5. Returns and Refunds
Returns are accepted **within 30 days** for unopened products.  
Contact us at contact@vitanou.com.

## 6. Intellectual Property
All content on Vitanou.com is the property of **AnandarCompany LLC**.

## 7. User Conduct
Users must not misuse the site or submit false information.

## 8. Limitation of Liability
We are not liable for indirect or incidental damages.

## 9. Privacy
See our Privacy Policy.

## 10. Governing Law
These terms follow the laws of **Kentucky, USA**.

## 11. Contact
Email: contact@vitanou.com
    `,
  },
  "/refund-policy": {
    content: `
# Refund & Return Policy

**Effective Date:** June 03, 2025

We want you to be satisfied with your purchase. If not, this policy explains how to request a return or refund.

## 1. Eligibility for Returns
You may request a return if:
- The request is made within **30 days**
- The product is **unopened** and in **original condition**
- You have proof of purchase

Not eligible:
- Opened items  
- Items after 30 days  
- Sale products  

## 2. Return Process
Email **contact@vitanou.com**.  
Return shipping is the customer's responsibility unless we made an error.

## 3. Refunds
Refunds are processed within **5–10 business days** after inspection.  
Shipping fees are non-refundable.

## 4. Damaged or Incorrect Items
Contact us within **7 days** with photos.  
We will replace or refund the item.

## 5. Exchanges
We do not offer direct exchanges. Place a new order after returning the item.

## 6. Late or Missing Refunds
Check with your bank or card provider first.  
If you still have concerns, contact us.

## 7. Contact
Email: contact@vitanou.com  
Address: 203 Seneca Trail, Louisville, KY 40214
    `,
  },
  "/medical-disclaimer": {
    content: `
# Medical Disclaimer

**Effective Date:** June 03, 2025  
**Website:** Vitanou.com  
**Business:** AnandarCompany LLC  
**Email:** contact@vitanou.com

## 1. Not Medical Advice
Content on Vitanou.com is for **informational purposes only**.  
Nothing on the site or in our products is medical advice.

Our supplements are **not evaluated by the FDA** and are not intended to diagnose, treat, cure, or prevent disease.

## 2. Consult a Healthcare Professional
Speak with a licensed professional before:
- Using any supplement  
- Changing diet, exercise, or medications  
- Using products while pregnant, breastfeeding, under 18, or with medical conditions  

## 3. Individual Results May Vary
Results vary between individuals.  
Testimonials are personal experiences, not guarantees.

## 4. FDA Disclaimer
Statements have not been evaluated by the U.S. Food and Drug Administration (FDA).

## 5. No Doctor-Patient Relationship
Using this website does not create a doctor-patient relationship.

## 6. Contact
Email: contact@vitanou.com  
Address: 203 Seneca Trail, Louisville, KY 40214
    `,
  },
  "/shipping-policy": {
    content: `
# Shipping Policy

**Effective Date:** June 03, 2025  
**Website:** Vitanou.com  
**Operated by:** AnandarCompany LLC  
**Address:** 203 Seneca Trail, Louisville, KY 40214  
**Email:** contact@vitanou.com

## 1. Order Processing Time
- Processing: **1–3 business days** (Monday–Friday)  
- Orders placed on weekends or holidays are processed next business day  

## 2. Shipping Rates & Delivery Times

Shipping is calculated at checkout.

### USA Delivery
- Standard: 3–7 business days  
- Expedited: 1–3 business days  

### International
- Delivery: 7–21 business days (varies by country)  
- Customs fees are the customer’s responsibility  

## 3. Shipping Carriers
We ship via USPS, UPS, FedEx, and DHL.  
Tracking details are emailed once shipped.

## 4. Shipping Restrictions
- Shipping available in the United States  
- International shipping available by request  
- No shipping to P.O. boxes or APO/FPO unless arranged  

## 5. Lost or Stolen Packages
We are not responsible for packages marked as **delivered** by the carrier.  
For lost shipments, contact the carrier first.

## 6. Incorrect Addresses
We are not responsible for incorrect addresses entered at checkout.

## 7. Order Tracking
Tracking information is provided by email after shipment.

## 8. Contact
Email: contact@vitanou.com  
Address: 203 Seneca Trail, Louisville, KY 40214, USA
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
        title: "About | Vitanou",
        description: "Learn about Vitanou's mission and values."
      };

    case "terms":
      return {
        title: "Terms and Conditions | Vitanou",
        description: "Terms and Conditions for Vitanou.com"
      };

    case "privacy":
      return {
        title: "Privacy Policy | Vitanou",
        description: "Privacy Policy for Vitanou.com"
      };

    case "refund-policy":
      return {
        title: "Refund & Return Policy | Vitanou",
        description: "Refund and Return Policy for Vitanou.com"
      };

    case "shipping-policy":
      return {
        title: "Shipping Policy | Vitanou",
        description: "Shipping Policy for Vitanou.com"
      };

    case "medical-disclaimer":
      return {
        title: "Medical Disclaimer | Vitanou",
        description: "Medical Disclaimer for Vitanou.com"
      };

    case "contact":
      return {
        title: "Contact | Vitanou",
        description: "Contact Vitanou support."
      };

    default:
      return {
        title: "Vitanou Store",
        description: "Vitanou Store - Quality Supplements"
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
