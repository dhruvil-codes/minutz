"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconLayoutDashboard,
  IconVideo,
  IconSettings,
  IconLogout,
  IconUpload,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const navLinks = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <IconLayoutDashboard className="h-5 w-5 shrink-0 text-[#A3A3A3]" />,
  },
  {
    label: "Meetings",
    href: "/dashboard/meetings",
    icon: <IconVideo className="h-5 w-5 shrink-0 text-[#A3A3A3]" />,
  },
  {
    label: "Import",
    href: "/dashboard/import",
    icon: <IconUpload className="h-5 w-5 shrink-0 text-[#A3A3A3]" />,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <IconSettings className="h-5 w-5 shrink-0 text-[#A3A3A3]" />,
  },
];

function MinutzLogo() {
  return (
    <Link href="/dashboard" className="relative z-20 flex items-center py-0.5">
      <Image
        src="/logo-dark.png"
        alt="Minutz"
        width={118}
        height={30}
        priority
        style={{ height: "auto" }}
        className="hidden dark:block"
      />
      <Image
        src="/logo-light.png"
        alt="Minutz"
        width={110}
        height={28}
        priority
        style={{ height: "auto" }}
        className="block dark:hidden"
      />
    </Link>
  );
}

function MinutzLogoIcon() {
  return (
    <Link href="/dashboard" className="relative z-20 flex items-center justify-center py-0.5">
      <Image
        src="/icon16.png"
        alt="Minutz icon"
        width={22}
        height={22}
        priority
        className="rounded-md"
      />
    </Link>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
    router.push("/login");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#000000]">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-6 border-r border-[#2A2A2A] bg-[#0D0D0D]">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <div className="relative mb-1 h-8">
              <motion.div
                animate={{ opacity: open ? 0 : 1, scale: open ? 0.92 : 1 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <MinutzLogoIcon />
              </motion.div>
              <motion.div
                animate={{ opacity: open ? 1 : 0, x: open ? 0 : -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute inset-0 flex items-center"
              >
                <MinutzLogo />
              </motion.div>
            </div>

            <div className="mt-5 flex flex-col gap-1.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <div
                    key={link.href}
                    className={cn(
                      "rounded-lg transition-colors duration-150",
                      isActive
                        ? "bg-[rgba(255,122,26,0.08)] border-l-2 border-[#FF7A1A]"
                        : "hover:bg-[rgba(255,255,255,0.03)]"
                    )}
                  >
                    <SidebarLink
                      link={{
                        ...link,
                        icon: (
                          <link.icon.type
                            className={cn(
                              "h-5 w-5 shrink-0",
                              isActive ? "text-[#FF6A00]" : "text-[#A3A3A3]"
                            )}
                          />
                        ),
                      }}
                      className={cn(
                        "px-3 py-2.5",
                        isActive ? "text-white" : "text-[#A3A3A3] hover:text-white"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#2A2A2A] pt-3">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="h-auto w-full justify-start gap-2 rounded-lg px-3 py-2 text-[#A3A3A3] hover:bg-[#1A1A1A] hover:text-white"
            >
              <IconLogout className="h-5 w-5 shrink-0" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-sm whitespace-pre"
              >
                Sign out
              </motion.span>
            </Button>
          </div>
        </SidebarBody>
      </Sidebar>

      <main className="flex-1 overflow-auto bg-[#000000] p-4 sm:p-6">
        {children}
      </main>

      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
