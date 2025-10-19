import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import Card from '@/components/Card';
import { Button } from '@/components/Button';
import { ADMIN_DASHBOARD_PATH } from '@/pages/admin/constants';

const AdminTicketScanner: React.FC = () => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const controlsRef = useRef<IScannerControls | null>(null);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<string | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    useEffect(() => {
        const scanner = new BrowserMultiFormatReader();
        let isMounted = true;

        const startScanning = async () => {
            const videoElement = videoRef.current;
            if (!videoElement) {
                if (isMounted) {
                    requestAnimationFrame(startScanning);
                }
                return;
            }

            try {
                controlsRef.current = await scanner.decodeFromVideoDevice(
                    undefined,
                    videoElement,
                    (result, error) => {
                        if (!isMounted) return;
                        if (result) {
                            setLastResult(result.getText());
                        }
                        if (error && !(error instanceof NotFoundException)) {
                            console.error(error);
                            setScannerError("Une erreur est survenue lors de la lecture du billet.");
                        }
                    }
                );
                if (isMounted) {
                    setScannerError(null);
                    setIsCameraReady(true);
                }
            } catch (error) {
                console.error(error);
                if (!isMounted) return;
                setScannerError(
                    "Impossible d'accéder à la caméra. Vérifiez les permissions de votre navigateur."
                );
                setIsCameraReady(false);
            }
        };

        void startScanning();

        return () => {
            isMounted = false;
            controlsRef.current?.stop();
            controlsRef.current = null;
            const videoElement = videoRef.current;
            const stream = videoElement?.srcObject as MediaStream | null;
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
            if (videoElement) {
                videoElement.srcObject = null;
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-gray-500">Contrôle des billets</p>
                        <h1 className="text-2xl font-semibold text-primary-600">Scanner les billets</h1>
                        <p className="text-sm text-gray-500">
                            Présentez le QR code devant la caméra pour vérifier le billet.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" size="sm" onClick={() => setLastResult(null)}>
                            Effacer le dernier scan
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate(ADMIN_DASHBOARD_PATH)}>
                            Retour au tableau de bord
                        </Button>
                    </div>
                </Card>

                <Card className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Flux caméra</h2>
                            <p className="text-sm text-gray-500">
                                Assurez-vous que votre navigateur autorise l&apos;accès à la caméra.
                            </p>
                        </div>
                        {!isCameraReady && !scannerError && (
                            <span className="text-sm font-medium text-primary-500">Initialisation de la caméra…</span>
                        )}
                    </div>
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-black sm:aspect-video">
                        <video
                            ref={videoRef}
                            className="h-full w-full object-cover"
                            autoPlay
                            muted
                            playsInline
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <div className="h-40 w-40 border-2 border-primary-400/80 sm:h-56 sm:w-56" />
                        </div>
                    </div>
                    {scannerError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {scannerError}
                        </div>
                    )}
                </Card>

                <Card className="flex flex-col gap-3">
                    <h2 className="text-lg font-semibold text-gray-800">Dernier billet scanné</h2>
                    {lastResult ? (
                        <code className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-900">{lastResult}</code>
                    ) : (
                        <p className="text-sm text-gray-500">
                            Aucun QR code scanné pour le moment. Placez un billet devant la caméra pour commencer.
                        </p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default AdminTicketScanner;
