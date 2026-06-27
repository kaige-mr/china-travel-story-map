import React from 'react';

export interface PhotoLightboxProps {
  isOpen: boolean;
  photoUrl: string;
  caption?: string;
  onClose: () => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  isOpen,
  photoUrl,
  caption,
  onClose
}) => {
  if (!isOpen || !photoUrl) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
    >
      <img
        src={photoUrl}
        alt={caption || 'Travel preview'}
        style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '4px' }}
      />
      {caption && (
        <p style={{ color: '#FFFFFF', marginTop: '12px', fontSize: '14px', textAlign: 'center' }}>
          {caption}
        </p>
      )}
    </div>
  );
};
