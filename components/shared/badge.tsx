import Image from "next/image";

export default function BadgeTrust({
    className,
}: {
    className?: string;
}) {
    return (
        <div className={className}>
            <div className="px-0 md:px-20 mt-6 md:mt-12">
                <Image className="dark:hidden" src={"/trust_badge.png"} alt="trust badge" width={1000} height={1000} />
                <Image className="dark:block hidden" src={"/trust_badge_dark.png"} alt="trust badge" width={1000} height={1000} />
            </div>
            <div>
                <div className="my-4 flex flex-wrap items-center justify-center gap-4">
                    <Image src="/visa.svg" alt="Visa" width={48} height={28} />
                    <Image src="/mastercard.svg" alt="Mastercard" width={48} height={28} />
                    <Image src="/apple-pay.svg" alt="Apple Pay" width={48} height={28} />
                    <Image src="/google-pay.svg" alt="Google Pay" width={48} height={28} />
                    {/* <span className="text-muted-foreground mx-2">|</span> */}
                    <Image src="/paypal.svg" alt="PayPal" width={48} height={28} />
                </div>
                <div className="my-4 flex flex-wrap items-center justify-center gap-4">
                    {/* <Image src="/dhl(1).svg" alt="DHL Express" width={40} height={25} />
                        <Image src="/dhl.svg" alt="DHL Express" width={40} height={25} /> */}
                    <Image src="/dhl-express.svg" alt="DHL Express" width={48} height={28} />
                    <Image src="/ups.svg" alt="UPS" width={48} height={28} />
                    <Image src="/american-express.svg" alt="American Express" width={48} height={28} />
                    <Image src="/fedex.svg" alt="FedEx" width={48} height={28} />
                </div>
            </div>
        </div>
    );
}