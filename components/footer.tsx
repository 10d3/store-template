import { Logo } from '@/components/logo'
import Image from 'next/image'
import Link from 'next/link'
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa'

const links = [
    {
        title: 'About',
        href: '/about',
    },
    {
        title: 'Affiliate Program',
        href: '/affiliate-program',
    },
    {
        title: 'Terms & Conditions',
        href: '/terms',
    },
    {
        title: 'Privacy Policy',
        href: '/privacy',
    },
    {
        title: 'Medical Disclaimer',
        href: '/medical-disclaimer',
    },
    {
        title: 'Shipping Policy',
        href: '/shipping-policy',
    },
    {
        title: 'Refund Policy',
        href: '/refund-policy',
    },
]

export default function FooterSection() {
    return (
        <footer className="mt-10 md:mt-20">
            <div className="mx-auto max-w-5xl px-6">
                <Link
                    href="/"
                    aria-label="go home"
                    className="mx-auto block size-fit">
                    <Image
                        src="/logo_noir_png.png"
                        alt="Logo"
                        width={100}
                        height={100}
                        className="mx-auto block dark:hidden size-fit"
                    />
                    <Image
                        src="/logo_blanc_png.png"
                        alt="Logo"
                        width={100}
                        height={100}
                        className="mx-auto hidden dark:block size-fit"
                    />
                </Link>

                <div className="my-4 flex flex-wrap justify-center gap-6 text-sm">
                    {links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.href}
                            className="text-muted-foreground hover:text-primary block duration-150">
                            <span>{link.title}</span>
                        </Link>
                    ))}
                </div>
                <div className="my-4 flex flex-wrap justify-center gap-6 text-sm">
                    <Link
                        href="https://www.facebook.com/share/1Mp4DKfcjH/?mibextid=wwXIfr"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                        className="text-muted-foreground hover:text-primary block">
                        <FaFacebook className="size-6" />
                    </Link>
                    <Link
                        href="https://www.instagram.com/vitanou1?igsh=dWU5ODE1bHBuM3lh&utm_source=qr"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        className="text-muted-foreground hover:text-primary block">
                        <FaInstagram className="size-6" />
                    </Link>
                    <Link
                        href="https://www.tiktok.com/@vitanou?_r=1&_t=ZT-92AOblArGIP"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="TikTok"
                        className="text-muted-foreground hover:text-primary block">
                        <FaTiktok className="size-6" />
                    </Link>
                </div>

                {/* Payment Methods & Shipping */}
                <div className="my-4 flex flex-wrap items-center justify-center gap-4">
                    <Image src="/visa.svg" alt="Visa" width={40} height={25} />
                    <Image src="/mastercard.svg" alt="Mastercard" width={40} height={25} />
                    <Image src="/apple-pay.svg" alt="Apple Pay" width={40} height={25} />
                    <Image src="/google-pay.svg" alt="Google Pay" width={40} height={25} />
                    {/* <span className="text-muted-foreground mx-2">|</span> */}
                    <Image src="/paypal.svg" alt="PayPal" width={48} height={25} />
                </div>
                <div className="my-4 flex flex-wrap items-center justify-center gap-4">
                    {/* <Image src="/dhl(1).svg" alt="DHL Express" width={40} height={25} />
                    <Image src="/dhl.svg" alt="DHL Express" width={40} height={25} /> */}
                    <Image src="/dhl-express.svg" alt="DHL Express" width={40} height={25} />
                    <Image src="/ups.svg" alt="UPS" width={40} height={25} />
                    <Image src="/american-express.svg" alt="American Express" width={40} height={25} />
                    <Image src="/fedex.svg" alt="FedEx" width={40} height={25} />
                </div>

                {/* FDA Disclaimer Card */}
                <div className="my-8 rounded-xl border border-foreground p-5 text-center text-xs text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                    These statements have not been evaluated by the Food and Drug Administration (FDA). Vitanou products are not intended to diagnose, treat, cure, or prevent any disease. The information provided by Vitanou is for educational and wellness purposes only and should not be considered medical advice. Always consult your healthcare provider before using any dietary supplement, especially if you are pregnant, nursing, taking medication, or have a medical condition. Individual results may vary.
                </div>

                <span className="text-muted-foreground block text-center text-sm"> © {new Date().getFullYear()} Vitanou, All rights reserved</span>
            </div>
        </footer>
    )
}
