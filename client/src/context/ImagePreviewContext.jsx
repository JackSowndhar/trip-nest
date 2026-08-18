import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';

const ImagePreviewContext = createContext(null);

export const ImagePreviewProvider = ({ children }) => {
  const [previewImage, setPreviewImage] = useState(null); // { src, title }

  const showPreview = (src, title) => {
    if (!src) return;
    setPreviewImage({ src, title });
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <ImagePreviewContext.Provider value={{ showPreview }}>
      {children}
      {previewImage && (
        <div 
          onClick={closePreview}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative bg-white/10 p-2 rounded-3xl flex flex-col items-center shadow-2xl border border-white/20 animate-scale-up overflow-hidden"
          >
            {/* Close button */}
            <button 
              onClick={closePreview}
              className="absolute top-4 right-4 text-white bg-black/40 hover:bg-black/60 rounded-full w-8 h-8 flex items-center justify-center transition-all z-10 hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 overflow-hidden flex items-center justify-center bg-black/20 rounded-2xl">
              <img 
                src={previewImage.src} 
                alt={previewImage.title || 'Profile'} 
                className="w-full h-full object-cover select-none"
              />
            </div>
            {previewImage.title && (
              <p className="mt-4 text-white font-medium text-sm text-center px-4 truncate max-w-full">
                {previewImage.title}
              </p>
            )}
          </div>
        </div>
      )}
    </ImagePreviewContext.Provider>
  );
};

export const useImagePreview = () => {
  const context = useContext(ImagePreviewContext);
  if (!context) {
    throw new Error('useImagePreview must be used within an ImagePreviewProvider');
  }
  return context;
};
