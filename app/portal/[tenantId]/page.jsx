'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function CaptivePortal() {
    const params = useParams();
    const tenantId = params.tenantId;

    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [macAddress, setMacAddress] = useState('AA:BB:CC:DD:EE:FF'); 
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('selection'); 
    const [checkoutRequestId, setCheckoutRequestId] = useState(null);

    const API_URL = 'https://mconnect-back-end.onrender.com';
    const packages = [
        { id: 1, name: '1 Hour Flash', duration: '1 Hour', price: 20, description: 'Instant browsing, social media' },
        { id: 2, name: '24 Hours Unlimited', duration: '12 Hours', price: 50, description: 'Half-day streaming' },
        { id: 3, name: 'Weekly Pass', duration: '7 Days', price: 350, description: 'Remote work users' },
    ];

    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/\D/g, '');
        if (val.length <= 9) {
            setPhoneNumber(val);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (phoneNumber.length !== 9 || !selectedPackage) return;

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/payments/stk-push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    phoneNumber: `254${phoneNumber}`,
                    packageId: selectedPackage.id,
                    macAddress
                })
            });

            const data = await response.json();
            
            if (response.ok && data.checkoutRequestId) {
                setCheckoutRequestId(data.checkoutRequestId);
                setStep('processing'); // Enter automated polling loop
            } else {
                alert(data.message || 'Payment initiation failed. Please try again.');
                setStep('selection');
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Network connection error.');
            setStep('selection');
        } finally {
            setLoading(false);
        }
    };

    // AUTOMATED POLLING EFFECT: Checks payment status every 3 seconds
    useEffect(() => {
        let interval = null;

        if (step === 'processing' && checkoutRequestId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`${API_URL}/api/payments/status/${checkoutRequestId}`);
                    const data = await res.json();

                    if (data.status === 'Completed' || data.success) {
                        setStep('success');
                        clearInterval(interval);
                    } else if (data.status === 'Failed' || data.status === 'Cancelled') {
                        alert('Payment was cancelled or failed.');
                        setStep('selection');
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error('Polling check error:', err);
                }
            }, 3000); // Check every 3 seconds
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [step, checkoutRequestId, API_URL]);

    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-100 font-['Bricolage_Grotesque',sans-serif] flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-black">
            
            {/* Main Wrapper Container */}
            <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
                
                {/* Header Branding */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-3">
                        MCONNECT HIGH-SPEED INTERNET
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                        Instant High-Speed Access
                    </h1>
                </div>

                {/* STEP 1: PACKAGE & SELECTION */}
                {step === 'selection' && (
                    <form onSubmit={handlePayment} className="space-y-5">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                                Select Speed Plan
                            </label>
                            <div className="space-y-3">
                                {packages.map((pkg) => (
                                    <div 
                                        key={pkg.id}
                                        onClick={() => setSelectedPackage(pkg)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                                            selectedPackage?.id === pkg.id 
                                                ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-950/40 text-white' 
                                                : 'border-neutral-800/80 bg-neutral-900/50 hover:border-neutral-700 text-neutral-300'
                                        }`}
                                    >
                                        <div>
                                            <p className="font-bold text-sm tracking-wide">{pkg.name}</p>
                                            <p className="text-xs text-neutral-400 mt-0.5">{pkg.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-emerald-400 font-extrabold text-base">Ksh {pkg.price}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                                M-Pesa Phone Number
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-3 text-neutral-400 text-sm font-semibold">+254</span>
                                <input 
                                    type="tel"
                                    placeholder="712345678"
                                    value={phoneNumber}
                                    onChange={handlePhoneChange}
                                    required
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2.5 pl-16 pr-4 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500 transition-colors tracking-wide font-medium"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!selectedPackage || phoneNumber.length !== 9 || loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-neutral-800 disabled:text-neutral-600 text-black font-extrabold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm tracking-wide cursor-pointer disabled:cursor-not-allowed"
                        >
                            {loading ? 'Initiating STK...' : 'Connect at Full Speed'}
                        </button>
                    </form>
                )}

                {/* STEP 2: STK PUSH PROCESSING (AUTOMATED LISTENER) */}
                {step === 'processing' && (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <h2 className="text-lg font-bold text-white">Approve STK Prompt</h2>
                        <p className="text-sm text-neutral-400 max-w-xs mx-auto leading-relaxed">
                            M-Pesa authorization sent to <span className="text-neutral-200 font-semibold">+254 {phoneNumber}</span>. Enter your PIN.
                        </p>
                        
                        {/* Manual escape hatch in case they entered the wrong number */}
                        <button
                            onClick={() => setStep('selection')}
                            className="mt-2 w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-2.5 rounded-xl text-sm transition-colors cursor-pointer"
                        >
                            Cancel / Change Number
                        </button>
                    </div>
                )}

                {/* STEP 3: SUCCESS STATE */}
                {step === 'success' && (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center text-xl mx-auto font-bold">
                            ✓
                        </div>
                        <h2 className="text-lg font-bold text-white">Speed Unlocked!</h2>
                        <p className="text-sm text-neutral-400 leading-relaxed">
                            Payment verified successfully. Enjoy your ultra-fast network session.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-xl text-sm transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                        >
                            Proceed to Internet
                        </button>
                    </div>
                )}

            </div>

            {/* Footer Signature */}
            <div className="text-center mt-6 space-y-1">
                <p className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                    Helpline: chat +254799600294
                </p>
                <p className="text-[11px] text-neutral-600 tracking-wide">
                    Powered by <span className="text-neutral-400 font-medium">Astariqa Labs</span>
                </p>
            </div>
        </main>
    );
}