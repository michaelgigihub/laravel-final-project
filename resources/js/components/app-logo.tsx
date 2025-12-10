export default function AppLogo() {
    return (
        <div className="flex items-center gap-2">
            <img
                src="/BlueTooth-logo.svg"
                alt="BlueTooth Logo"
                className="h-8 w-8"
            />
            <span 
                className="text-lg text-foreground"
                style={{ fontFamily: 'Clash Display, sans-serif', fontWeight: 600 }}
            >
                BlueTooth
            </span>
        </div>
    );
}
