"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyableCodeProps {
    children: React.ReactNode;
    className?: string;
    copyText?: string;
    showCopyButton?: boolean;
}

export default function CopyableCode({ 
    children, 
    className = "", 
    copyText,
    showCopyButton = true 
}: CopyableCodeProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            const textToCopy = copyText || (typeof children === 'string' ? children : '');
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className={`relative group ${className}`}>
            {children}
            {showCopyButton && (
                <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    title="Copy to clipboard"
                >
                    {copied ? (
                        <Check className="h-4 w-4 text-green-400" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                </button>
            )}
        </div>
    );
}
