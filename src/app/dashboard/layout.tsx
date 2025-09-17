"use client";

import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { MenuIcon, XIcon } from 'lucide-react'
import authClient from "@/auth/authClient"; // Assuming default export from your authClient setup
import { useRouter } from "next/navigation";
import { startTransition } from 'react';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import EnvironmentDropdown from '@/components/EnvironmentDropdown';
import { EnvironmentProvider } from '@/components/EnvironmentProvider';
import EnvironmentGate from '@/components/EnvironmentGate';

const handleSignOut = async (router: AppRouterInstance) => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        startTransition(() => {
          router.replace("/"); // Redirect to home page on sign out
        });
      },
      onError: err => {
        console.error("Sign out error:", err);
        router.replace("/");
      },
    },
  });
};

const user = {
  name: 'Tom Cook',
  email: 'tom@example.com',
  imageUrl:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
}
const navigation = [
  { name: 'Dashboard', href: '/dashboard', current: false },
  { name: 'Webhooks', href: '/dashboard/webhooks', current: false },
  { name: 'Proxy', href: '/dashboard/proxy', current: false },
  { name: 'Log', href: '/dashboard/log', current: false },
  { name: 'Metrics', href: '/dashboard/metrics', current: false },
  { name: 'Admin', href: '/dashboard/admin', current: false, adminOnly: true },
]
const userNavigation = (router: AppRouterInstance) => [
  { name: 'Account', href: '/dashboard/account', current: false },
  { name: 'API Keys', href: '/dashboard/api-keys', current: false },
  { name: 'Sign out', href: '#', onClick: () => handleSignOut(router) },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const nav = navigation.map((item) => ({ ...item, current: item.href === pathname }));

  const currentPathName = [...navigation, ...userNavigation(router)].map((item) => ({ ...item, current: item.href === pathname })).find(item => item.current)?.name;

  return (
    <EnvironmentProvider>
      <EnvironmentGate>
        <div className="min-h-full">
        <div className="relative bg-gray-800 pb-32">
          <Disclosure as="nav" className="bg-gray-800">
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
              <div className="border-b border-white/10">
                <div className="flex h-16 items-center justify-between px-4 sm:px-0">
                  <div className="flex items-center">
                    <EnvironmentDropdown />
                    <div className="hidden md:block">
                      <div className="ml-10 flex items-baseline space-x-4">
                        {nav.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            aria-current={item.current ? 'page' : undefined}
                            className={classNames(
                              item.current
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-300 hover:bg-white/5 hover:text-white',
                              'rounded-md px-3 py-2 text-sm font-medium',
                            )}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-4 flex items-center md:ml-6">
                      {/* Profile dropdown */}
                      <Menu as="div" className="relative ml-3">
                        <MenuButton className="relative flex max-w-xs items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
                          <span className="absolute -inset-1.5" />
                          <span className="sr-only">Open user menu</span>
                          <img
                            alt=""
                            src={user.imageUrl}
                            className="size-8 rounded-full outline -outline-offset-1 outline-white/10"
                          />
                        </MenuButton>

                        <MenuItems
                          transition
                          className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg outline-1 outline-black/5 transition data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                        >
                          {userNavigation(router).map((item) => (
                            <MenuItem key={item.name}>
                              { item.onClick ? (
                                <button onClick={item.onClick} className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden">
                                  {item.name}
                                </button>
                              ) : (
                                <Link href={item.href} className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden">
                                  {item.name}
                                </Link>
                              )}
                            </MenuItem>
                          ))}
                        </MenuItems>
                      </Menu>
                    </div>
                  </div>
                  <div className="-mr-2 flex md:hidden">
                    {/* Mobile menu button */}
                    <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-indigo-500">
                      <span className="absolute -inset-0.5" />
                      <span className="sr-only">Open main menu</span>
                      <MenuIcon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                      <XIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
                    </DisclosureButton>
                  </div>
                </div>
              </div>
            </div>

            <DisclosurePanel className="border-b border-white/10 md:hidden">
              <div className="space-y-1 px-2 py-3 sm:px-3">
                {nav.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    className={classNames(
                      item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white',
                      'block rounded-md px-3 py-2 text-base font-medium',
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 pb-3">
                <div className="flex items-center px-5">
                  <div className="shrink-0">
                    <img
                      alt=""
                      src={user.imageUrl}
                      className="size-10 rounded-full outline -outline-offset-1 outline-white/10"
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-base/5 font-medium text-white">{user.name}</div>
                    <div className="text-sm font-medium text-gray-400">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  {userNavigation(router).map((item) => (
                    item.onClick ? (
                      <button
                        key={item.name}
                        onClick={item.onClick}
                        className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-white/5 hover:text-white"
                      >
                        {item.name}
                      </button>
                    ) : (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-white/5 hover:text-white"
                      >
                        {item.name}
                      </Link>
                    )
                  ))}
                </div>
              </div>
            </DisclosurePanel>
          </Disclosure>
          <header className="py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-bold tracking-tight text-white">{currentPathName}</h1>
            </div>
          </header>
        </div>

        <main className="relative -mt-32">
          <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
            <div className="rounded-lg bg-gray-100 px-5 py-6 shadow-sm border border-gray-200 sm:px-6">
              {children}
            </div>
          </div>
        </main>
        </div>
      </EnvironmentGate>
    </EnvironmentProvider>
  )
}
