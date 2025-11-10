import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export default function Welcome() {
    const { auth, name } = usePage<SharedData>().props;
    const heroWrapperRef = useRef<HTMLDivElement>(null);
    const [heroHeight, setHeroHeight] = useState(0);
    const [parallaxProgress, setParallaxProgress] = useState(0);

    useEffect(() => {
        document.documentElement.style.scrollbarWidth = 'none';
        (document.documentElement.style as any).msOverflowStyle = 'none';
        const style = document.createElement('style');
        style.textContent = `
            html::-webkit-scrollbar {
                display: none;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.documentElement.style.scrollbarWidth = '';
            (document.documentElement.style as any).msOverflowStyle = '';
            document.head.removeChild(style);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const measure = () => {
            if (!heroWrapperRef.current) {
                const fallback = window.innerHeight;
                setHeroHeight((prev) => (Math.abs(prev - fallback) < 1 ? prev : fallback));
                return;
            }

            const { height } = heroWrapperRef.current.getBoundingClientRect();
            const nextHeight = height || window.innerHeight;
            setHeroHeight((prev) => (Math.abs(prev - nextHeight) < 1 ? prev : nextHeight));
        };

        measure();

        let observer: ResizeObserver | null = null;

        if (heroWrapperRef.current && 'ResizeObserver' in window) {
            observer = new ResizeObserver(() => {
                measure();
            });
            observer.observe(heroWrapperRef.current);
        } else {
            window.addEventListener('resize', measure);
        }

        return () => {
            observer?.disconnect();
            if (!observer) {
                window.removeEventListener('resize', measure);
            }
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || heroHeight <= 0) {
            return;
        }

        let rafId = 0;

        const updateProgress = () => {
            rafId = 0;
            const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            const travelDistance = Math.max(Math.min(heroHeight, maxScroll), 1);
            const nextProgress = Math.min(1, Math.max(0, window.scrollY / travelDistance));
            setParallaxProgress((prev) => (Math.abs(prev - nextProgress) < 0.001 ? prev : nextProgress));
        };

        const scheduleUpdate = () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(updateProgress);
        };

        updateProgress();

        window.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', scheduleUpdate);

        return () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
            }
            window.removeEventListener('scroll', scheduleUpdate);
            window.removeEventListener('resize', scheduleUpdate);
        };
    }, [heroHeight]);

    const parallaxOffset = (1 - parallaxProgress) * 100;

    return (
        <>
            <Head>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=inter:400,500,600,700|playfair-display:400,400i&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://api.fontshare.com/v2/css?f[]=clash-display@600&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative bg-brand-dark">
                {/* Navigation */}
                <nav className="fixed top-0 left-0 right-0 z-50 mx-auto flex items-center justify-between px-8 py-6 lg:px-16">
                    <div className="flex items-center gap-2">
                        <img
                            src="/BlueTooth-logo.svg"
                            alt="BlueTooth Logo"
                            className="h-10 w-10 logo-brand-light"
                        />
                        <span className="text-xl text-brand-light" style={{ fontFamily: 'Clash Display, sans-serif', fontWeight: 600 }}>
                            {name || 'BlueTooth'}
                        </span>
                    </div>

                    {/* Tabs For Navbar - use if needed */}
                    <div className="hidden items-center gap-8 text-sm font-medium text-brand-light md:flex">
                        <Link href="#" className="opacity-80 hover:opacity-100">
                            Our Dentists
                        </Link>
                        <Link href="#" className="opacity-80 hover:opacity-100">
                            Services
                        </Link>
                        <Link href="#" className="opacity-80 hover:opacity-100">
                            About Us
                        </Link>
                        <Link href="#" className="opacity-80 hover:opacity-100">
                            Reviews
                        </Link>
                        <Link href="#" className="opacity-80 hover:opacity-100">
                            FAQs
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden items-center gap-2 text-sm text-brand-light md:flex">
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                            <span className="opacity-80">Manila, PH</span>
                        </div>
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="rounded-full bg-brand-light px-6 py-2.5 text-sm font-medium text-brand-dark shadow-sm hover:opacity-90"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="rounded-full px-6 py-2.5 text-sm font-medium text-brand-light opacity-80 hover:opacity-100"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={register()}
                                    className="rounded-full bg-brand-light px-6 py-2.5 text-sm font-medium text-brand-dark shadow-sm hover:opacity-90"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Main Container */}
                <div
                    ref={heroWrapperRef}
                    className="fixed left-0 right-0 top-4 min-h-screen p-6 pt-16 lg:p-12 lg:pt-20"
                >
                    <div className="relative mx-auto h-full min-h-[calc(100vh-12rem)] rounded-[12px] bg-brand-light lg:min-h-[calc(100vh-14rem)] lg:rounded-[24px]">
                        {/* Hero Section */}
                        <main className="relative z-10 px-8 pb-10 pt-10 lg:px-16 lg:pb-14 lg:pt-14">
                            {/* Hero Content */}
                            <div className="mb-8 flex flex-col items-center gap-5 text-center lg:mb-10">
                                <div className="flex w-full max-w-5xl flex-col items-center gap-5">
                                    <h1 className="font-display text-[clamp(3rem,6vw,6rem)] font-bold leading-[1.05] text-brand-dark">
                                        <span className="flex flex-wrap items-center justify-center gap-4">
                                            <span className="tracking-tight" >Your dream</span>
                                            <span className="relative inline-flex h-[clamp(3.25rem,9vw,4.5rem)] w-[clamp(8rem,20vw,10rem)] items-center justify-center overflow-hidden rounded-full shadow-lg">
                                                <img
                                                    src="/elements/hero-pill-1.png"
                                                    alt="Dental care"
                                                    className="h-full w-full object-cover"
                                                />
                                            </span>
                                        </span>
                                        <span className="mt-4 flex flex-wrap items-center justify-center gap-4">
                                            <span className="relative inline-block px-3">
                                                <span className="relative z-10 italic" style={{ fontFamily: 'Playfair Display, serif' }}>smile</span>
                                                <span
                                                    aria-hidden
                                                    className="absolute inset-x-[-0.25rem] top-1/2 h-[clamp(3rem,8vw,4rem)] -translate-y-1/2 bg-brand-blue/25"
                                                />
                                            </span>
                                            <span className="relative inline-flex h-[clamp(3.25rem,9vw,4.5rem)] w-[clamp(8rem,20vw,10rem)] items-center justify-center overflow-hidden rounded-full shadow-lg">
                                                <img
                                                    src="/elements/hero-pill-2.png"
                                                    alt="Happy smile"
                                                    className="h-full w-full object-cover"
                                                />
                                            </span>
                                            <span>is our</span>
                                        </span>
                                    </h1>

                                    <div className="flex flex-wrap items-center justify-center gap-4">
                                        <span className="inline-flex h-[clamp(3.25rem,7vw,3.75rem)] w-[clamp(3.25rem,7vw,3.75rem)] items-center justify-center rounded-full bg-brand-dark text-brand-light shadow-xl">
                                            <svg
                                                className="h-9 w-9 text-brand-light"
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                            </svg>
                                        </span>
                                        <span className="font-display text-[clamp(3rem,6vw,6rem)] font-bold leading-[1.05] text-brand-dark">
                                            Care
                                        </span>
                                        <Link
                                            href={register()}
                                            className="inline-flex items-center justify-center rounded-full bg-brand-blue px-[clamp(2rem,5vw,2.75rem)] py-[clamp(0.85rem,2.2vw,1.1rem)] text-[clamp(1rem,2.3vw,1.3rem)] font-semibold text-white shadow-xl transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/60"
                                        >
                                            Book Your Appointment Online
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Best Deals Section */}
                            <div className="flex items-start gap-6 lg:gap-8">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-2xl font-bold text-brand-dark lg:text-3xl">
                                        Best Deals
                                    </h2>
                                    <Link
                                        href="#"
                                        className="text-xs font-medium text-brand-dark underline opacity-60 hover:opacity-100 lg:text-sm"
                                    >
                                        View all services
                                    </Link>
                                </div>

                                <div className="grid flex-1 gap-4 md:grid-cols-3">
                                    {/* Card 1 - Online Consultations */}
                                    <div className="group relative overflow-hidden rounded-2xl bg-brand-dark p-5 text-brand-light transition-transform hover:scale-105 lg:rounded-3xl lg:p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="mb-1 text-xs font-medium opacity-60">
                                                    1
                                                </div>
                                                <h3 className="text-lg font-bold leading-tight lg:text-xl">
                                                    Online
                                                    <br />
                                                    Consultations
                                                </h3>
                                            </div>
                                            <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/20 transition-colors hover:bg-white/10 lg:h-9 lg:w-9">
                                                <svg
                                                    className="h-4 w-4 lg:h-5 lg:w-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 4v16m8-8H4"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card 2 - Best Dentists */}
                                    <div className="group relative overflow-hidden rounded-2xl bg-brand-gray p-5 transition-transform hover:scale-105 lg:rounded-3xl lg:p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="mb-1 text-xs font-medium text-brand-dark opacity-60">
                                                    2
                                                </div>
                                                <h3 className="text-lg font-bold leading-tight text-brand-dark lg:text-xl">
                                                    Best
                                                    <br />
                                                    Dentists
                                                </h3>
                                            </div>
                                            <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-brand-dark/20 transition-colors hover:bg-black/5 lg:h-9 lg:w-9">
                                                <svg
                                                    className="h-4 w-4 text-brand-dark lg:h-5 lg:w-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 4v16m8-8H4"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Card 3 - 20+ Clinics */}
                                    <div className="group relative overflow-hidden rounded-2xl bg-brand-gray p-5 transition-transform hover:scale-105 lg:rounded-3xl lg:p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="mb-1 text-xs font-medium text-brand-dark opacity-60">
                                                    3
                                                </div>
                                                <h3 className="text-lg font-bold leading-tight text-brand-dark lg:text-xl">
                                                    20+
                                                    <br />
                                                    Clinics
                                                </h3>
                                            </div>
                                            <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-brand-dark/20 transition-colors hover:bg-black/5 lg:h-9 lg:w-9">
                                                <svg
                                                    className="h-4 w-4 text-brand-dark lg:h-5 lg:w-5"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 4v16m8-8H4"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </main>

                        {/* Decorative curved line */}
                        <div className="absolute bottom-0 left-0 right-0 -z-10 h-96 w-full opacity-20">
                            <svg
                                className="h-full w-full"
                                viewBox="0 0 1200 400"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M0 200C200 100 400 100 600 200C800 300 1000 300 1200 200"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-brand-dark"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Spacer to enable scrolling */}
                <div className="h-[200vh]"></div>

                {/* Second Container */}
                <div
                    className="fixed left-0 right-0 top-4 min-h-screen p-6 pt-16 lg:p-12 lg:pt-20"
                    style={{
                        transform: `translateY(${parallaxOffset}%)`,
                        height: heroHeight || undefined,
                        willChange: 'transform',
                        zIndex: 20
                    }}
                >
                    <div className="relative mx-auto h-full min-h-[calc(100vh-12rem)] rounded-[12px] bg-brand-blue p-8 shadow-2xl lg:min-h-[calc(100vh-14rem)] lg:rounded-[24px] lg:p-16">
                        {/* Second Container Content */}
                        <div className="flex min-h-[80vh] flex-col items-center justify-center text-center text-white">
                            <h2 className="mb-6 text-5xl font-bold lg:text-7xl">
                                Why Choose Us?
                            </h2>
                            <p className="mb-8 max-w-2xl text-lg opacity-90 lg:text-xl">
                                Experience world-class dental care with our team of experienced professionals
                                using the latest technology and techniques.
                            </p>

                            <div className="mt-12 grid gap-8 md:grid-cols-3">
                                <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                                    <div className="mb-4 text-4xl">Icon</div>
                                    <h3 className="mb-2 text-xl font-bold">Expert Team</h3>
                                    <p className="text-sm opacity-80">
                                        Board-certified dentists with years of experience
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                                    <div className="mb-4 text-4xl">Icon</div>
                                    <h3 className="mb-2 text-xl font-bold">Advanced Technology</h3>
                                    <p className="text-sm opacity-80">
                                        State-of-the-art equipment for precise treatments
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                                    <div className="mb-4 text-4xl">Icon</div>
                                    <h3 className="mb-2 text-xl font-bold">Patient Care</h3>
                                    <p className="text-sm opacity-80">
                                        Comfortable environment with personalized attention
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
