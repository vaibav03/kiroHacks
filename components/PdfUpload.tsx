'use client';
import React, { useState, useRef } from 'react';
import { useAppContext } from '@/context/AppContext';

export default function PdfUpload() {
  const { domain, pdfValidated, setPdfValidated } = useAppContext();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !domain) return;
    
    if (file.type !== 'application/pdf') {
      setError("INVALID FORMAT: PDF REQ.");
      return;
    }

    setIsUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('domain', domain);

    try {
      const res = await fetch('/api/validate-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "VALIDATION FAILED");

      if (data.matches) {
        setPdfValidated(true);
      } else {
        setError(`OFF-TOPIC: ${data.reason}`);
      }
    } catch (err: any) {
      setError(err.message || "SYSTEM ERROR");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (pdfValidated) {
    return (
      <div className="w-full retro-panel p-4 text-center border-[#10b981] bg-[#10b981]/10">
        <p className="text-[#10b981] text-xs">MODULES UNLOCKED</p>
      </div>
    );
  }

  return (
    <div className="w-full retro-panel p-4 flex flex-col items-center">
      <p className="text-[10px] text-gray-400 mb-4 text-center leading-relaxed uppercase">UPLOAD CHAPTER TO UNLOCK MODULES</p>
      
      <input 
        type="file" 
        accept="application/pdf" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleUpload}
      />
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="retro-btn w-full py-3"
      >
        {isUploading ? "SCANNING..." : "UPLOAD"}
      </button>

      {error && <p className="text-red-500 text-[10px] mt-4 text-center uppercase">{error}</p>}
    </div>
  );
}
