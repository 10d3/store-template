import { Logo } from '@/components/logo'
import Image from 'next/image'
import Link from 'next/link'

const links = [
    {
        title: 'About',
        href: '/about',
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
        <footer className="">
            <div className="mx-auto max-w-5xl px-6">
                <Link
                    href="/"
                    aria-label="go home"
                    className="mx-auto block size-fit">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={100}
                        height={100}
                        className="mx-auto block size-fit"
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
                        <svg
                            className="size-6"
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95"></path>
                        </svg>
                    </Link>
                    <Link
                        href="https://www.instagram.com/vitanou1?igsh=dWU5ODE1bHBuM3lh&utm_source=qr"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        className="text-muted-foreground hover:text-primary block">
                        <svg
                            className="size-6"
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"></path>
                        </svg>
                    </Link>
                    <Link
                        href="https://www.tiktok.com/@vitanou?_r=1&_t=ZT-92AOblArGIP"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="TikTok"
                        className="text-muted-foreground hover:text-primary block">
                        <svg
                            className="size-6"
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64c0 3.33 2.76 5.7 5.69 5.7c3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48"></path>
                        </svg>
                    </Link>
                </div>

                {/* Payment Methods & Shipping */}
                <div className="my-4 flex flex-wrap items-center justify-center gap-4">
                    <Image src="/visa.svg" alt="Visa" width={40} height={25} />
                    <Image src="/mastercard.svg" alt="Mastercard" width={40} height={25} />
                    <Image src="/apple-pay.svg" alt="Apple Pay" width={40} height={25} />
                    <Image src="/google-pay.svg" alt="Google Pay" width={40} height={25} />
                    {/* <span className="text-muted-foreground mx-2">|</span> */}
                    {/* <Image src="/dhl.svg" alt="DHL" width={50} height={25} /> */}
                </div>
                <div className="my-4 flex flex-wrap items-center justify-center gap-4">
                    <Image src="/dhl(1).svg" alt="DHL Express" width={40} height={25} />
                    <Image src="/dhl.svg" alt="DHL Express" width={40} height={25} />
                    <Image src="/dhl-express.svg" alt="DHL Express" width={40} height={25} />
                </div>

                <span className="text-muted-foreground block text-center text-sm"> © {new Date().getFullYear()} Vitanou, All rights reserved</span>
            </div>
        </footer>
    )
}
