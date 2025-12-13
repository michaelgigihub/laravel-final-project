import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useRef, useState } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Check, X } from 'lucide-react';

interface ImageCropDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageSrc: string;
    onCropComplete: (croppedImageBlob: Blob) => void;
}

/**
 * Creates a cropped image from the source image and crop area
 */
async function getCroppedImg(
    image: HTMLImageElement,
    crop: PixelCrop
): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    // Calculate the scale between natural and displayed size
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to match the crop area (at natural resolution)
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    // Draw the cropped image
    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Canvas is empty'));
                }
            },
            'image/jpeg',
            0.9
        );
    });
}

/**
 * Creates a centered square crop for the initial state
 */
function centerSquareCrop(
    mediaWidth: number,
    mediaHeight: number
): Crop {
    const size = Math.min(mediaWidth, mediaHeight) * 0.8;
    return centerCrop(
        makeAspectCrop(
            {
                unit: 'px',
                width: size,
            },
            1, // 1:1 aspect ratio for square
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

export function ImageCropDialog({
    open,
    onOpenChange,
    imageSrc,
    onCropComplete,
}: ImageCropDialogProps) {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isProcessing, setIsProcessing] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const initialCrop = centerSquareCrop(width, height);
        setCrop(initialCrop);
    };

    const handleConfirm = async () => {
        if (!completedCrop || !imgRef.current) return;

        setIsProcessing(true);
        try {
            const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
            onCropComplete(croppedBlob);
            onOpenChange(false);
            resetState();
        } catch (error) {
            console.error('Error cropping image:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
        resetState();
    };

    const resetState = () => {
        setCrop(undefined);
        setCompletedCrop(undefined);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Crop Image</DialogTitle>
                    <DialogDescription>
                        Drag the corners or edges to resize the crop area. Drag inside to move it.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center bg-muted rounded-lg p-2 max-h-[400px] overflow-auto">
                    <ReactCrop
                        crop={crop}
                        onChange={(c) => setCrop(c)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={1}
                        circularCrop={false}
                        keepSelection={true}
                        className="max-h-[380px]"
                    >
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Image to crop"
                            onLoad={onImageLoad}
                            style={{ maxHeight: '380px', maxWidth: '100%' }}
                        />
                    </ReactCrop>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isProcessing}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isProcessing || !completedCrop}
                    >
                        <Check className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Processing...' : 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
