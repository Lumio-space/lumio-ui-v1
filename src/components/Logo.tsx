import Image from 'next/image';
import { LUMIO_LOGO } from '@/lib/branding';
import { cn } from '@/lib/utils';
interface LogoProps {
    /** 'light' = for dark backgrounds (logo sits on a white chip), 'dark' = for light backgrounds */
    variant?: 'light' | 'dark';
    className?: string;
    imgClassName?: string;
}
export function Logo({ variant = 'dark', className, imgClassName }: LogoProps) {
    if (variant === 'light') {
        return (
            <div
                className={cn(
                    'inline-flex items-center rounded-xl bg-white px-3 py-1.5 shadow-sm',
                    className
                )}>

                <Image
                    src={LUMIO_LOGO}
                    alt="Lumio"
                    width={120}
                    height={32}
                    className={cn('h-6 w-auto', imgClassName)} />

            </div>);

    }
    return (
        <div className={cn('inline-flex items-center', className)}>
            <Image
                src={LUMIO_LOGO}
                alt="Lumio"
                width={140}
                height={38}
                className={cn('h-7 w-auto', imgClassName)} />

        </div>);

}