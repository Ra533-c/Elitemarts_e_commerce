'use client';

/**
 * Payment Session Manager
 * Handles localStorage persistence for payment sessions with 12-hour expiry
 */

const SESSION_KEY = 'elitemarts_payment_session';
const SESSION_EXPIRY_HOURS = 12;

/**
 * Create a new payment session
 */
export function createPaymentSession(sessionId, customerData, pricing) {
    const session = {
        sessionId,
        customerData,
        pricing,
        createdAt: Date.now(),
        expiry: Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000,
    };

    if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    return session;
}

/**
 * Get the current payment session if valid
 */
export function getPaymentSession() {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (!stored) return null;

        const session = JSON.parse(stored);

        // Check if session has expired
        if (Date.now() > session.expiry) {
            clearPaymentSession();
            return null;
        }

        return session;
    } catch (error) {
        console.error('Error reading payment session:', error);
        return null;
    }
}

/**
 * Clear the payment session
 */
export function clearPaymentSession() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_KEY);
    }
}

/**
 * Check if there's a valid pending session
 */
export function hasPendingSession() {
    const session = getPaymentSession();
    return session !== null;
}

/**
 * Custom hook for payment session management
 */
export function usePaymentSession() {
    return {
        createSession: createPaymentSession,
        getSession: getPaymentSession,
        clearSession: clearPaymentSession,
        hasPending: hasPendingSession,
    };
}
