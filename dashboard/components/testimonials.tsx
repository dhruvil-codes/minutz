import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Verified } from "lucide-react";

const testimonials = [
    {
        avatar: "/illustrations/avatar-1.svg",
        name: "Rahul S.",
        handle: "@rahuls_ae",
        content: "Minutz saved me 2 hours a day on post-call CRM updates. I just review the summary and move on.",
        verified: true,
    },
    {
        avatar: "/illustrations/avatar-2.svg",
        name: "Priya M.",
        handle: "@priyam_pm",
        content: "Finally, my standup notes write themselves. <span class='text-blue-500'>@minutz_ai</span> is the tool I didn't know I needed.",
        verified: false,
    },
    {
        avatar: "/illustrations/avatar-3.svg",
        name: "Vikram D.",
        handle: "@vikramd_fa",
        content: "The compliance flag feature alone is worth it.",
        verified: true,
    },
    {
        avatar: "/illustrations/avatar-3.svg",
        name: "Ananya K.",
        handle: "@ananyak",
        content: "I used to spend 30 mins after every client call. Now it's instant.",
        verified: false,
    },
    {
        avatar: "/illustrations/avatar-3.svg",
        name: "Rohan T.",
        handle: "@rohant_sales",
        content: "The sales mode catches objections I missed in the moment. Game changer.",
        verified: false,
    },
    {
        avatar: "/illustrations/avatar-3.svg",
        name: "Meera J.",
        handle: "@meeraj_pm",
        content: "Action items auto-assigned to the right people. This is what AI should feel like.",
        verified: true,
    },
];

const Testimonials = () => {
    return (
        <section className="mx-auto max-w-5xl px-4">
            <div className="mb-12 text-center">
                <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                    From people who live in meetings.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-base">
                    Real feedback from our beta users.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((t, i) => (
                    <Card key={i} className="rounded-3xl border border-muted-foreground/20 bg-card dark:bg-muted-foreground/15 dark:border-0 shadow-none gap-0">
                        <CardHeader className="flex-row items-center gap-3 space-y-0 pb-4">
                            <div className="flex items-center gap-3">
                                <Image src={t.avatar} alt={t.name} width={40} height={40} className="h-10 w-10 rounded-full" />
                                <div className="flex flex-col gap-0">
                                    <div className="flex items-center gap-1">
                                        <span className="text-base font-medium text-foreground">{t.name}</span>
                                        {t.verified && <Verified fill="#1D9BF0" className="size-5 text-white" />}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{t.handle}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="font-medium leading-relaxed text-foreground">{t.content}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
};

export default Testimonials;
