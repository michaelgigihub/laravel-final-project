import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import gsap from 'gsap';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export default function Welcome() {
    const { auth, name } = usePage<SharedData>().props;
    const tvFrameRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [currentSection, setCurrentSection] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hoveredDot, setHoveredDot] = useState<number | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Section names for tooltips / navigation dots
    const sectionNames = ['Home', 'Services', 'Dentists', 'Reviews', 'FAQs'];

    // Animation refs
    const heroContentRef = useRef<HTMLDivElement>(null);
    const dreamTextRef = useRef<HTMLSpanElement>(null);
    const pill1Ref = useRef<HTMLSpanElement>(null);
    const pill1ShutterRef = useRef<HTMLSpanElement>(null);
    const smileTextRef = useRef<HTMLSpanElement>(null);
    const smileHighlightRef = useRef<HTMLSpanElement>(null);
    const pill2Ref = useRef<HTMLSpanElement>(null);
    const pill2ShutterRef = useRef<HTMLSpanElement>(null);
    const isOurTextRef = useRef<HTMLSpanElement>(null);
    const heartIconRef = useRef<HTMLSpanElement>(null);
    const careTextRef = useRef<HTMLSpanElement>(null);
    const ctaButtonRef = useRef<HTMLAnchorElement>(null);
    const ctaShineRef = useRef<HTMLSpanElement>(null);
    const bestDealsRef = useRef<HTMLDivElement>(null);

    // Hero entrance animations
    useLayoutEffect(() => {
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const ctx = gsap.context(() => {
            // Set initial states
            gsap.set([dreamTextRef.current, isOurTextRef.current, careTextRef.current], {
                opacity: 0,
                y: 30,
            });

            gsap.set([pill1Ref.current, pill2Ref.current], {
                opacity: 1,
            });

            // Shutters start fully covering the pills (at 0%)
            gsap.set([pill1ShutterRef.current, pill2ShutterRef.current], {
                yPercent: 0,
            });

            gsap.set(smileTextRef.current, {
                opacity: 0,
            });

            gsap.set(smileHighlightRef.current, {
                scaleX: 0,
                transformOrigin: 'left center',
            });

            gsap.set(heartIconRef.current, {
                opacity: 0,
                scale: 0,
            });

            gsap.set(ctaButtonRef.current, {
                opacity: 0,
                y: 25,
                scale: 0.9,
                rotateX: 15,
            });

            gsap.set(ctaShineRef.current, {
                xPercent: -100,
                opacity: 0,
            });

            gsap.set(bestDealsRef.current, {
                opacity: 0,
                y: 30,
            });

            // Create main timeline
            const tl = gsap.timeline({
                defaults: {
                    ease: 'power3.out',
                },
                delay: 0.3,
            });

            // 1. "Your dream" text fades in and slides up
            tl.to(dreamTextRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.8,
            });

            // 2. First pill - shutter slides up to reveal image
            tl.to(pill1ShutterRef.current, {
                yPercent: -100,
                duration: 0.7,
                ease: 'power2.inOut',
            }, '-=0.4');

            // 3. "smile" text appears, then highlighter draws across
            tl.to(smileTextRef.current, {
                opacity: 1,
                duration: 0.4,
            }, '-=0.2');

            tl.to(smileHighlightRef.current, {
                scaleX: 1,
                duration: 0.6,
                ease: 'power2.inOut',
            }, '-=0.1');

            // 4. Second pill - shutter slides up to reveal image
            tl.to(pill2ShutterRef.current, {
                yPercent: -100,
                duration: 0.7,
                ease: 'power2.inOut',
            }, '-=0.4');

            // 5. "is our" text fades in
            tl.to(isOurTextRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.6,
            }, '-=0.4');

            // 6. Heart icon springs in with bounce
            tl.to(heartIconRef.current, {
                opacity: 1,
                scale: 1,
                duration: 0.5,
                ease: 'back.out(2)',
            }, '-=0.2');

            // 7. "Care" text slides in
            tl.to(careTextRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.6,
            }, '-=0.3');

            // 8. CTA button - smooth 3D pop entrance
            tl.to(ctaButtonRef.current, {
                opacity: 1,
                y: 0,
                scale: 1,
                rotateX: 0,
                duration: 0.7,
                ease: 'back.out(1.4)',
            }, '-=0.2');

            // Shine effect sweeps across the button
            tl.to(ctaShineRef.current, {
                opacity: 0.6,
                duration: 0.1,
            }, '-=0.3');

            tl.to(ctaShineRef.current, {
                xPercent: 200,
                duration: 0.6,
                ease: 'power2.inOut',
            }, '-=0.1');

            tl.to(ctaShineRef.current, {
                opacity: 0,
                duration: 0.2,
            }, '-=0.1');

            // 9. Best Deals section fades in
            tl.to(bestDealsRef.current, {
                opacity: 1,
                y: 0,
                duration: 0.6,
            }, '-=0.2');

        }, heroContentRef);

        return () => ctx.revert();
    }, []);

    // Handle scroll snap section detection
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const sectionHeight = container.clientHeight;
            const newSection = Math.round(scrollTop / sectionHeight);
            setCurrentSection(newSection);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll to section with tension animation
    const scrollToSection = (index: number) => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const sectionHeight = container.clientHeight;
        container.scrollTo({
            top: index * sectionHeight,
            behavior: 'smooth'
        });
    };

    // Hide scrollbar globally for the snap container
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .snap-scroll-container::-webkit-scrollbar {
                display: none;
            }
            .snap-scroll-container {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Set loaded state after initial render to prevent visible seams
    useEffect(() => {
        // Small delay to ensure everything is painted
        const timer = requestAnimationFrame(() => {
            setIsLoaded(true);
        });
        return () => cancelAnimationFrame(timer);
    }, []);

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
            <div className="relative h-screen overflow-hidden bg-brand-dark">
                {/* Navigation */}
                <nav className="fixed top-0 left-0 right-0 z-50 mx-auto flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 lg:px-12 xl:px-16">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <img
                            src="/BlueTooth-logo.svg"
                            alt="BlueTooth Logo"
                            className="h-7 w-7 logo-brand-light sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10"
                        />
                        <span className="text-base text-brand-light sm:text-lg md:text-xl" style={{ fontFamily: 'Clash Display, sans-serif', fontWeight: 600 }}>
                            {name || 'BlueTooth'}
                        </span>
                    </div>

                    {/* Nav links removed in favor of dot navigation */}
                    <div className="hidden lg:flex" />

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden items-center gap-1.5 text-xs text-brand-light sm:gap-2 sm:text-sm md:flex">
                            <svg
                                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
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
                                className="rounded-full bg-brand-light px-4 py-2 text-xs font-medium text-brand-dark shadow-sm hover:opacity-90 sm:px-5 sm:py-2.5 sm:text-sm md:px-6"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                href={login()}
                                className="rounded-full bg-brand-light px-4 py-2 text-xs font-medium text-brand-dark shadow-sm hover:opacity-90 sm:px-5 sm:py-2.5 sm:text-sm md:px-6"
                            >
                                Log in
                            </Link>
                        )}
                    </div>
                </nav>

                {/* TV Frame Container - Fixed outer border */}
                <div
                    ref={tvFrameRef}
                    className="fixed left-0 right-0 top-2 p-3 pt-14 sm:top-3 sm:p-4 sm:pt-16 md:top-4 md:p-6 md:pt-18 lg:p-8 lg:pt-20 xl:p-12 xl:pt-20"
                    style={{ height: 'calc(100vh - 0.5rem)', zIndex: 10 }}
                >
                    {/* TV Screen Border/Frame */}
                    <div className="relative mx-auto h-full overflow-hidden rounded-[8px] bg-brand-light sm:rounded-[12px] md:rounded-[16px] lg:rounded-[20px] xl:rounded-[24px]">
                        {/* Scrollable Inner Content - The "TV Screen" */}
                        <div
                            ref={scrollContainerRef}
                            className={`snap-scroll-container h-full w-full snap-y snap-mandatory overflow-y-auto scroll-smooth bg-brand-light transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                WebkitOverflowScrolling: 'touch'
                            }}
                        >
                            {/* Section 1: Hero */}
                            <section
                                className="relative flex h-full w-full flex-shrink-0 snap-start snap-always flex-col bg-brand-light"
                                style={{ boxShadow: '0 2px 0 0 var(--color-brand-light, #f6f6f7)' }}
                            >
                                <main className="relative z-10 flex flex-1 flex-col px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6 md:px-8 md:pb-8 md:pt-8 lg:px-12 lg:pb-10 lg:pt-10 xl:px-16 xl:pb-12 xl:pt-12">
                                    {/* Hero Content - Centered */}
                                    <div ref={heroContentRef} className="flex flex-1 flex-col items-center justify-center text-center">
                                        <div className="flex w-full max-w-5xl flex-col items-center gap-3 sm:gap-4 md:gap-5">
                                            <h1 className="font-display text-[clamp(1.75rem,5vw,6rem)] font-bold leading-[1.1] text-brand-dark sm:leading-[1.08] md:leading-[1.05]">
                                                <span className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
                                                    <span ref={dreamTextRef} className="tracking-tight">Your dream</span>
                                                    <span ref={pill1Ref} className="relative inline-flex h-[clamp(1.75rem,6vw,4.5rem)] w-[clamp(4.5rem,15vw,10rem)] items-center justify-center overflow-hidden rounded-full shadow-lg">
                                                        <img
                                                            src="/elements/hero-pill-1.png"
                                                            alt="Dental care"
                                                            className="h-full w-full object-cover"
                                                        />
                                                        {/* Shutter overlay */}
                                                        <span
                                                            ref={pill1ShutterRef}
                                                            aria-hidden
                                                            className="absolute inset-0 bg-brand-blue"
                                                        />
                                                    </span>
                                                </span>
                                                <span className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:mt-3 sm:gap-3 md:mt-4 md:gap-4">
                                                    <span className="relative inline-block px-1 sm:px-2 md:px-3">
                                                        <span ref={smileTextRef} className="relative z-10 italic" style={{ fontFamily: 'Playfair Display, serif' }}>smile</span>
                                                        <span
                                                            ref={smileHighlightRef}
                                                            aria-hidden
                                                            className="absolute inset-x-[-0.15rem] top-1/2 h-[clamp(1.5rem,5vw,4rem)] -translate-y-1/2 bg-brand-blue/25 sm:inset-x-[-0.2rem] md:inset-x-[-0.25rem]"
                                                        />
                                                    </span>
                                                    <span ref={pill2Ref} className="relative inline-flex h-[clamp(1.75rem,6vw,4.5rem)] w-[clamp(4.5rem,15vw,10rem)] items-center justify-center overflow-hidden rounded-full shadow-lg">
                                                        <img
                                                            src="/elements/hero-pill-2.png"
                                                            alt="Happy smile"
                                                            className="h-full w-full object-cover"
                                                        />
                                                        {/* Shutter overlay */}
                                                        <span
                                                            ref={pill2ShutterRef}
                                                            aria-hidden
                                                            className="absolute inset-0 bg-brand-blue"
                                                        />
                                                    </span>
                                                    <span ref={isOurTextRef}>is our</span>
                                                </span>
                                            </h1>

                                            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
                                                <span ref={heartIconRef} className="inline-flex h-[clamp(2rem,5vw,3.75rem)] w-[clamp(2rem,5vw,3.75rem)] items-center justify-center rounded-full bg-brand-dark text-brand-light shadow-xl">
                                                    <svg
                                                        className="h-5 w-5 text-brand-light sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-9 lg:w-9"
                                                        fill="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                    </svg>
                                                </span>
                                                <span ref={careTextRef} className="font-display text-[clamp(1.75rem,5vw,6rem)] font-bold leading-[1.1] text-brand-dark sm:leading-[1.08] md:leading-[1.05]">
                                                    Care
                                                </span>
                                                <Link
                                                    ref={ctaButtonRef}
                                                    href={register()}
                                                    className="relative inline-flex items-center justify-center overflow-hidden rounded-full bg-brand-blue px-4 py-2 text-xs font-semibold text-white shadow-xl transition-all duration-200 hover:shadow-2xl hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/60 sm:px-5 sm:py-2.5 sm:text-sm md:px-6 md:py-3 md:text-base lg:px-8 lg:py-3.5 lg:text-lg xl:px-10 xl:py-4 xl:text-xl"
                                                    style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                                                >
                                                    <span className="relative z-10">Book Your Appointment Online</span>
                                                    {/* Shine overlay */}
                                                    <span
                                                        ref={ctaShineRef}
                                                        aria-hidden
                                                        className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                                        style={{ width: '50%' }}
                                                    />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Best Deals Section - Pinned to bottom */}
                                    <div ref={bestDealsRef} className="mt-auto flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6 lg:gap-8">
                                        <div className="flex flex-row items-center justify-between gap-2 sm:flex-col sm:items-start">
                                            <h2 className="text-lg font-bold text-brand-dark sm:text-xl md:text-2xl lg:text-3xl">
                                                Best Deals
                                            </h2>
                                            <Link
                                                href="#"
                                                className="text-xs font-medium text-brand-dark underline opacity-60 hover:opacity-100 lg:text-sm"
                                            >
                                                View all services
                                            </Link>
                                        </div>

                                        <div className="grid flex-1 grid-cols-1 gap-3 xs:grid-cols-2 sm:gap-4 md:grid-cols-3">
                                            {/* Card 1 - Online Consultations */}
                                            <div className="group relative overflow-hidden rounded-xl bg-brand-dark p-4 text-brand-light transition-transform hover:scale-105 sm:rounded-2xl sm:p-5 lg:rounded-3xl lg:p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="mb-1 text-[10px] font-medium opacity-60 sm:text-xs">
                                                            1
                                                        </div>
                                                        <h3 className="text-base font-bold leading-tight sm:text-lg lg:text-xl">
                                                            Online
                                                            <br />
                                                            Consultations
                                                        </h3>
                                                    </div>
                                                    <button className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/20 transition-colors hover:bg-white/10 sm:h-8 sm:w-8 lg:h-9 lg:w-9">
                                                        <svg
                                                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5"
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
                                            <div className="group relative overflow-hidden rounded-xl bg-brand-gray p-4 transition-transform hover:scale-105 sm:rounded-2xl sm:p-5 lg:rounded-3xl lg:p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="mb-1 text-[10px] font-medium text-brand-dark opacity-60 sm:text-xs">
                                                            2
                                                        </div>
                                                        <h3 className="text-base font-bold leading-tight text-brand-dark sm:text-lg lg:text-xl">
                                                            Best
                                                            <br />
                                                            Dentists
                                                        </h3>
                                                    </div>
                                                    <button className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-brand-dark/20 transition-colors hover:bg-black/5 sm:h-8 sm:w-8 lg:h-9 lg:w-9">
                                                        <svg
                                                            className="h-3.5 w-3.5 text-brand-dark sm:h-4 sm:w-4 lg:h-5 lg:w-5"
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
                                            <div className="group relative overflow-hidden rounded-xl bg-brand-gray p-4 transition-transform hover:scale-105 xs:col-span-2 sm:rounded-2xl sm:p-5 md:col-span-1 lg:rounded-3xl lg:p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="mb-1 text-[10px] font-medium text-brand-dark opacity-60 sm:text-xs">
                                                            3
                                                        </div>
                                                        <h3 className="text-base font-bold leading-tight text-brand-dark sm:text-lg lg:text-xl">
                                                            20+
                                                            <br />
                                                            Clinics
                                                        </h3>
                                                    </div>
                                                    <button className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-brand-dark/20 transition-colors hover:bg-black/5 sm:h-8 sm:w-8 lg:h-9 lg:w-9">
                                                        <svg
                                                            className="h-3.5 w-3.5 text-brand-dark sm:h-4 sm:w-4 lg:h-5 lg:w-5"
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

                            </section>

                            {/* Section 2: Services (horizontal snap) */}
                            <section
                                className="relative flex h-full w-full flex-shrink-0 snap-start snap-always flex-col bg-brand-light"
                                style={{ boxShadow: '0 -2px 0 0 var(--color-brand-light, #f6f6f7), 0 2px 0 0 var(--color-brand-light, #f6f6f7)' }}
                            >
                                <div className="flex flex-1 flex-col gap-6 px-4 py-10 text-brand-dark sm:px-6 md:px-10 lg:px-14 xl:px-16">
                                    <div className="text-center">
                                        <h2 className="mb-3 text-3xl font-bold sm:mb-4 sm:text-4xl md:text-5xl">Services</h2>
                                        <p className="text-sm opacity-70 sm:text-base">This is the services page (placeholder).</p>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-brand-light to-transparent pointer-events-none" />
                                        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-brand-light to-transparent pointer-events-none" />
                                        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-4 pt-2 sm:gap-6 sm:px-3" style={{ scrollBehavior: 'smooth' }}>
                                            {[1, 2, 3, 4].map((item) => (
                                                <div
                                                    key={item}
                                                    className="min-w-[240px] snap-start rounded-2xl bg-brand-dark/5 p-5 shadow-sm sm:min-w-[280px] sm:p-6"
                                                >
                                                    <div className="mb-2 text-xs uppercase tracking-wide text-brand-dark/60">Service {item}</div>
                                                    <div className="text-lg font-semibold">Placeholder card {item}</div>
                                                    <p className="mt-2 text-sm opacity-70">Scroll horizontally to see more placeholder services.</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3: Dentists placeholder */}
                            <section
                                className="relative flex h-full w-full flex-shrink-0 snap-start snap-always flex-col bg-brand-light"
                                style={{ boxShadow: '0 -2px 0 0 var(--color-brand-light, #f6f6f7), 0 2px 0 0 var(--color-brand-light, #f6f6f7)' }}
                            >
                                <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center text-brand-dark sm:px-6 md:px-10 lg:px-14 xl:px-16">
                                    <h2 className="mb-3 text-3xl font-bold sm:mb-4 sm:text-4xl md:text-5xl">Dentists</h2>
                                    <p className="text-sm opacity-70 sm:text-base">This is the dentists page (placeholder).</p>
                                </div>
                            </section>

                            {/* Section 4: Reviews placeholder */}
                            <section
                                className="relative flex h-full w-full flex-shrink-0 snap-start snap-always flex-col bg-brand-light"
                                style={{ boxShadow: '0 -2px 0 0 var(--color-brand-light, #f6f6f7), 0 2px 0 0 var(--color-brand-light, #f6f6f7)' }}
                            >
                                <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center text-brand-dark sm:px-6 md:px-10 lg:px-14 xl:px-16">
                                    <h2 className="mb-3 text-3xl font-bold sm:mb-4 sm:text-4xl md:text-5xl">Reviews</h2>
                                    <p className="text-sm opacity-70 sm:text-base">This is the reviews page (placeholder).</p>
                                </div>
                            </section>

                            {/* Section 5: FAQs placeholder */}
                            <section
                                className="relative flex h-full w-full flex-shrink-0 snap-start snap-always flex-col bg-brand-light"
                                style={{ boxShadow: '0 -2px 0 0 var(--color-brand-light, #f6f6f7), 0 2px 0 0 var(--color-brand-light, #f6f6f7)' }}
                            >
                                <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center text-brand-dark sm:px-6 md:px-10 lg:px-14 xl:px-16">
                                    <h2 className="mb-3 text-3xl font-bold sm:mb-4 sm:text-4xl md:text-5xl">FAQs</h2>
                                    <p className="text-sm opacity-70 sm:text-base">This is the FAQs page (placeholder).</p>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Section Indicators with Tooltips */}
                    <div className="absolute right-5 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3 sm:right-4 md:right-6 lg:right-8">
                        {sectionNames.map((sectionName, index) => (
                            <div key={index} className="relative flex items-center">
                                {/* Tooltip - hidden on mobile, shown on hover for larger screens */}
                                <div
                                    className={`absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-brand-light px-3 py-1.5 text-xs font-medium text-brand-dark shadow-lg transition-all duration-300 sm:block ${hoveredDot === index
                                        ? 'translate-x-0 opacity-100'
                                        : 'translate-x-2 opacity-0 pointer-events-none'
                                        }`}
                                >
                                    {sectionName}
                                    {/* Tooltip arrow */}
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                                        <div className="border-8 border-transparent border-l-brand-light" />
                                    </div>
                                </div>
                                {/* Dot indicator - dark on mobile (inside light container), light on desktop (outside on dark bg) */}
                                <button
                                    onClick={() => scrollToSection(index)}
                                    onMouseEnter={() => {
                                        hoverTimeoutRef.current = setTimeout(() => {
                                            setHoveredDot(index);
                                        }, 500);
                                    }}
                                    onMouseLeave={() => {
                                        if (hoverTimeoutRef.current) {
                                            clearTimeout(hoverTimeoutRef.current);
                                        }
                                        setHoveredDot(null);
                                    }}
                                    className={`h-3 w-3 rounded-full transition-all duration-300 sm:h-2.5 sm:w-2.5 ${currentSection === index
                                        ? 'scale-125 bg-brand-dark shadow-md sm:bg-brand-light'
                                        : 'bg-brand-dark/30 hover:bg-brand-dark/60 hover:scale-110 sm:bg-brand-light/40 sm:hover:bg-brand-light/70'
                                        }`}
                                    aria-label={`Go to ${sectionName} section`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
