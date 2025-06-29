import React from 'react';
import { DesktopBlocker } from './DesktopBlocker';

interface DesktopHandlerProps {
    children: React.ReactNode;
}

export function DesktopHandler({ children }: DesktopHandlerProps) {
    return <DesktopBlocker>{children}</DesktopBlocker>;
}
