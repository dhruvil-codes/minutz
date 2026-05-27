"use client"

import Link from "next/link";
import { motion } from "motion/react";
import Image from "next/image";
import { ThemeToggle } from "./theme-switch";

const Footer = () => {
    const links = [
        { name: "Privacy", href: "#" },
        { name: "Terms", href: "#" },
        { name: "Contact", href: "#" },
    ];
    const socialLinks: { label: string; href: string; icon: string }[] = [
        { label: "X", href: "#", icon: "/icons/x.svg" },
        { label: "LinkedIn", href: "#", icon: "/icons/linkedin.svg" },
        { label: "Facebook", href: "#", icon: "/icons/facebook.svg" },
        { label: "Instagram", href: "#", icon: "/icons/instagram.svg" },
        { label: "Tiktok", href: "#", icon: "/icons/tiktok.svg" },
    ];
    return (
        <motion.div
            className="flex flex-col gap-8 items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <span className="text-2xl font-bold" style={{ color: "#6366F1" }}>⚡ Minutz</span>
            <p className="text-sm text-muted-foreground">Invisible AI Meeting Intelligence</p>
            <ul className="grid grid-cols-3 gap-2 md:gap-8 items-center justify-center">
                {links.map((link) => (
                    <li key={link.name} className="flex flex-row items-center gap-1 hover:text-primary transition-all duration-300 text-muted-foreground">
                        <Link href={link.href}>{link.name}</Link>
                    </li>
                ))}
            </ul>
            <section className="flex flex-row gap-4">
                {socialLinks.map((link) => (
                    <Link key={link.label} href={link.href}>
                        <Image src={link.icon} alt={link.label} width={24} height={24} className="invert dark:invert-0 w-7 lg:w-8" />
                    </Link>
                ))}
            </section>
            <p className="text-muted-foreground">&copy; {new Date().getFullYear()} Minutz. Built with Claude Code + OpenAI</p>
        </motion.div>
    );
};

export default Footer;
