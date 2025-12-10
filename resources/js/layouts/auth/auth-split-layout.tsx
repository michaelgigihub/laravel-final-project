import ToothCartoonModel from '@/components/tooth-cartoon-model';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren, useEffect, useState, useCallback } from 'react';

// Fun facts and quotes about teeth and dental care
const dentalFunFacts = [
    // Fun Facts
    "The average person spends 38.5 days brushing their teeth over their lifetime.",
    "Tooth enamel is the hardest substance in the human body.",
    "A snail's mouth is no larger than a pin, yet it can have over 25,000 teeth.",
    "The first toothbrushes were tree twigs that were chewed until soft.",
    "Your teeth are as unique as your fingerprints. No two people have the same set.",
    "Dolphins only get one set of teeth to last their entire lifetime.",
    "The first dental floss was made from silk thread back in 1815.",
    "Ancient Egyptians used a paste made from crushed eggshells as toothpaste.",
    "Your mouth produces over 25,000 quarts of saliva in a lifetime.",
    "Eating cheese after meals can help protect your teeth from cavities.",
    "The blue whale is the largest animal on Earth, yet it has no teeth at all.",
    "George Washington's famous dentures were actually made from hippo ivory.",
    "Sharks can grow over 20,000 teeth in their lifetime.",
    "The average human will spend about 5 days of their life just waiting at red lights.",
    "Your teeth start forming before you are even born.",
    "Mosquitoes have 47 teeth. Yes, even mosquitoes have teeth.",
    "A tooth that gets knocked out can survive for 30 minutes outside the mouth.",
    "Right-handed people tend to chew food on the right side of their mouth.",
    "The most valuable tooth belonged to Isaac Newton. It sold for about 35,000 dollars.",
    "Giraffes only have bottom teeth. They use their lips and tongue to grab leaves.",
    "Crocodiles have 60 teeth at any given time, but can go through 3,000 in a lifetime.",
    "Human teeth are just as strong as shark teeth.",
    "The electric toothbrush was invented in 1954 in Switzerland.",
    "Cavities are the second most common disease, after the common cold.",
    "Dogs have 42 teeth, cats have 30, and pigs have 44.",
    
    // Inspirational Quotes
    "A smile is the prettiest thing you can wear.",
    "Smiling releases endorphins in your brain and naturally makes you feel happier.",
    "A confident smile can boost your self-esteem by up to 80 percent.",
    "Children laugh around 400 times a day, while adults only laugh about 15 times.",
    "Your smile is your logo, your personality is your business card.",
    "A warm smile is the universal language of kindness.",
    "The world always looks brighter from behind a smile.",
    "Smile, it is the key that fits the lock of everybody's heart.",
    "A smile is a curve that sets everything straight.",
    "Let your smile change the world, but do not let the world change your smile.",
    "Peace begins with a smile.",
    "Because of your smile, you make life more beautiful.",
    "A smile is happiness you will find right under your nose.",
    "Every tooth in a person's head is more valuable than a diamond.",
    "The greatest self is a peaceful smile that always sees the world smiling back.",
];

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

// Typing animation hook
function useTypingAnimation(text: string, speed: number = 30) {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        setDisplayedText('');
        setIsTyping(true);
        let currentIndex = 0;

        const typeNextChar = () => {
            if (currentIndex < text.length) {
                setDisplayedText(text.slice(0, currentIndex + 1));
                currentIndex++;
                setTimeout(typeNextChar, speed);
            } else {
                setIsTyping(false);
            }
        };

        const timer = setTimeout(typeNextChar, speed);
        return () => clearTimeout(timer);
    }, [text, speed]);

    return { displayedText, isTyping };
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;
    const [currentFactIndex, setCurrentFactIndex] = useState(0);
    
    const currentFact = dentalFunFacts[currentFactIndex];
    const { displayedText, isTyping } = useTypingAnimation(currentFact, 25);

    // Rotate fun facts every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentFactIndex((prev) => (prev + 1) % dentalFunFacts.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-zinc-900" />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center gap-1.5 text-lg font-medium sm:gap-2"
                >
                    <img
                        src="/BlueTooth-logo.svg"
                        alt="BlueTooth Logo"
                        className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10"
                        style={{ filter: 'brightness(0) invert(1)' }}
                    />
                    <span
                        className="text-base text-brand-light sm:text-lg md:text-xl"
                        style={{ fontFamily: 'Clash Display, sans-serif', fontWeight: 600 }}
                    >
                        BlueTooth
                    </span>
                </Link>
                
                {/* Speech Bubble - Fixed position */}
                <div className="relative z-20 flex flex-1 flex-col justify-end pb-8">
                    <div className="relative mx-auto w-full max-w-lg px-4">
                        <div className="rounded-[2rem] bg-white px-10 py-8 shadow-2xl">
                            <p className="min-h-[6rem] text-center text-2xl font-semibold leading-relaxed text-zinc-800">
                                {displayedText}
                            </p>
                        </div>
                        {/* Speech bubble tail */}
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                            <div className="h-0 w-0 border-l-[20px] border-r-[20px] border-t-[24px] border-l-transparent border-r-transparent border-t-white drop-shadow-md" />
                        </div>
                    </div>
                </div>

                {/* Tooth Mascot - Fixed at bottom */}
                <div className="relative z-20 flex items-end justify-center pb-4">
                    <ToothCartoonModel />
                </div>
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center gap-1.5 sm:gap-2 lg:hidden"
                    >
                        <img
                            src="/BlueTooth-logo.svg"
                            alt="BlueTooth Logo"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                        />
                        <span
                            className="text-base sm:text-lg"
                            style={{ fontFamily: 'Clash Display, sans-serif', fontWeight: 600 }}
                        >
                            BlueTooth
                        </span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
