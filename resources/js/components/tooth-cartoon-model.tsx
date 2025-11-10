import { useEffect, useRef, useState } from 'react';

export default function MouseTrackingEyes() {
    const [eyePositions, setEyePositions] = useState({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });
    const [isBlinking, setIsBlinking] = useState(false);
    const leftEyeRef = useRef<HTMLDivElement | null>(null);
    const rightEyeRef = useRef<HTMLDivElement | null>(null);

    // Random blinking effect
    useEffect(() => {
        const scheduleNextBlink = () => {
            const delay = Math.random() * 3000 + 2000; // Random delay between 2-5 seconds
            return setTimeout(() => {
                setIsBlinking(true);
                setTimeout(() => {
                    setIsBlinking(false);
                    scheduleNextBlink();
                }, 150); // Blink duration
            }, delay);
        };

        const timeoutId = scheduleNextBlink();

        return () => {
            clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            const updateEyePosition = (eyeRef: React.RefObject<HTMLDivElement | null>) => {
                if (!eyeRef.current) return { x: 0, y: 0 };

                const eye = eyeRef.current;
                const eyeRect = eye.getBoundingClientRect();
                const eyeCenterX = eyeRect.left + eyeRect.width / 2;
                const eyeCenterY = eyeRect.top + eyeRect.height / 2;

                const mouseX = event.clientX;
                const mouseY = event.clientY;

                const deltaX = mouseX - eyeCenterX;
                const deltaY = mouseY - eyeCenterY;

                const angle = Math.atan2(deltaY, deltaX);
                const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), 20);

                const pupilX = Math.cos(angle) * distance;
                const pupilY = Math.sin(angle) * distance;

                return { x: pupilX, y: pupilY };
            };

            setEyePositions({
                left: updateEyePosition(leftEyeRef),
                right: updateEyePosition(rightEyeRef),
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center">
            {/* Eyes Container - positioned absolutely over the tooth */}
            <div className="relative z-10 mb-[-200px] flex items-center justify-center gap-4">{/* Left Eye */}
                {/* Left Eye */}
                <div
                    ref={leftEyeRef}
                    className={`relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-black bg-white shadow-lg transition-all duration-150 ${isBlinking ? 'scale-y-[0.1]' : 'scale-y-100'
                        }`}
                >
                    <div
                        className="absolute h-10 w-10 rounded-full bg-gray-900 transition-transform duration-100 ease-out"
                        style={{
                            transform: `translate(${eyePositions.left.x}px, ${eyePositions.left.y}px)`,
                        }}
                    >
                        <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-white" />
                    </div>
                </div>

                {/* Right Eye */}
                <div
                    ref={rightEyeRef}
                    className={`relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-black bg-white shadow-lg transition-all duration-150 ${isBlinking ? 'scale-y-[0.1]' : 'scale-y-100'
                        }`}
                >
                    <div
                        className="absolute h-10 w-10 rounded-full bg-gray-900 transition-transform duration-100 ease-out"
                        style={{
                            transform: `translate(${eyePositions.right.x}px, ${eyePositions.right.y}px)`,
                        }}
                    >
                        <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-white" />
                    </div>
                </div>
            </div>

            {/* Tooth SVG Model */}
            <div className="relative z-0">
                <img
                    src="/elements/tooth-model.svg"
                    alt="Tooth"
                    className="h-[500px] w-auto drop-shadow-lg"
                />
            </div>
        </div>
    );
}
