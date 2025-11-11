import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { FaTwitter, FaX } from "react-icons/fa6";

export default function Page() {
  const socials = [{ icon: FaInstagram, href: "" }, { icon: FaFacebook, href: "" }, { icon: FaTwitter, href: "" }];

  async function subscribe(formData: FormData) {
    "use server";
    const email = formData.get("email");
    console.log({ email });
    // you can store email in DB, send to API, etc.
  }

  const images = Array.from({ length: 18 }, (_, i) => {
    const isLandscape = i % 2 === 0
    const width = isLandscape ? 800 : 600
    const height = isLandscape ? 600 : 800
    return `https://picsum.photos/seed/${i + 1}/${width}/${height}`
  })

  return (
    <div className="min-h-screen max-h-screen relative px-2 md:px-48">
      <div className="">
        <Image alt="logo vitanou" src={'/logo.png'} width={1000} height={1000} className="object-cover w-32 h-auto" />
      </div>
      <main className="flex flex-col">
        <div className="max-w-full md:max-w-6xl flex items-center h-1/2 mx-auto flex-col gap-12">
          <div className="flex flex-col gap-2 self-start">
            <span className="text-lg font-light">Coming Soon</span>
            <p className="font-medium">We're launching soon. Stay updated!</p>
          </div>

          <div className="flex flex-col w-full md:w-4xl gap-2">
            <h1 className="text-3xl md:text-5xl w-full md:max-w-sm font-bold mb-3">
              Get notified when we launch
            </h1>
            <form action={subscribe} className="flex flex-col md:flex-row w-full md:w-xl gap-2">
              <Input
                name="email"
                placeholder="Email address"
                type="email"
                required
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>

          <div className="flex gap-8 mt-4 md:self-start">
            {socials.map((item, i) => {
              const Icon = item.icon
              return (
                <Link key={i} href={item.href}>
                  <Icon className="size-7" />
                </Link>)
            })}
          </div>
        </div>
        {/* <div className="grid grid-cols-2 sm:grid-cols-3 rounded-lg gap-4 w-fit"> */}
        {/*   {images.map((imageUrl, idx) => ( */}
        {/*     <BlurFade key={imageUrl} delay={0.25 + idx * 0.05} inView> */}
        {/*       <img */}
        {/*         className="mb-4 size-full rounded-lg object-contain" */}
        {/*         src={imageUrl || "/placeholder.svg"} */}
        {/*         alt={`Random stock image ${idx + 1}`} */}
        {/*       /> */}
        {/*     </BlurFade> */}
        {/*   ))} */}
        {/* </div> */}
      </main>
    </div>
  );
}
