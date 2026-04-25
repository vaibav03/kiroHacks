'use client';

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import type { PanelConfig } from './types';
import styles from './LegacyCoverModal.module.css';

interface LegacyCoverModalProps {
  studentName: string;
  lessonTitle: string;
  panels: PanelConfig[];
  accentColor: string;
  onClose: () => void;
}

export function LegacyCoverModal({
  studentName,
  lessonTitle,
  panels,
  accentColor,
  onClose,
}: LegacyCoverModalProps) {
  const coverRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDownload = async () => {
    if (!coverRef.current) return;
    try {
      const dataUrl = await toPng(coverRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `${lessonTitle.replace(/\s+/g, '-')}-legacy-cover.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      showToast('Download failed — try again.');
    }
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `I just completed "${lessonTitle}" on Historia! Check out my Legacy Cover.`;

  const handleShare = (platform: 'facebook' | 'twitter' | 'instagram') => {
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      instagram: '', // Instagram doesn't support web share URLs — fallback to clipboard
    };

    if (platform === 'instagram' || !urls[platform]) {
      navigator.clipboard.writeText(shareUrl).then(
        () => showToast('Link copied! Paste it on Instagram.'),
        () => showToast('Could not copy link.')
      );
      return;
    }

    const popup = window.open(urls[platform], '_blank', 'width=600,height=400');
    if (!popup) {
      navigator.clipboard.writeText(shareUrl).then(
        () => showToast('Popup blocked — link copied instead!'),
        () => showToast('Popup blocked. Copy the URL manually.')
      );
    }
  };

  const sortedPanels = [...panels].sort((a, b) => a.order - b.order);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Legacy Cover">
      <div className={styles.modal}>
        {/* Cover to export */}
        <div ref={coverRef} className={styles.cover} style={{ borderColor: accentColor }}>
          <div className={styles.coverHeader} style={{ backgroundColor: accentColor }}>
            <span className={styles.coverLabel}>LEGACY COVER</span>
            <span className={styles.coverTitle}>{lessonTitle}</span>
          </div>

          <div className={styles.panelGrid}>
            {sortedPanels.map((panel) => (
              <div key={panel.id} className={styles.coverPanel}>
                <img
                  src={panel.dialogueSrc || panel.inkSrc || panel.sketchSrc}
                  alt={`Panel ${panel.order + 1}`}
                  className={styles.coverPanelImg}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>

          <div className={styles.coverFooter}>
            <span className={styles.authorLabel}>Written & Solved by</span>
            <span className={styles.authorName}>{studentName || 'Student'}</span>
            <span className={styles.poweredBy}>Historia · historia.app</span>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.downloadBtn}
            style={{ backgroundColor: accentColor }}
            onClick={handleDownload}
            type="button"
          >
            ⬇ Download PNG
          </button>

          <div className={styles.shareRow}>
            <span className={styles.shareLabel}>Share:</span>
            <button className={styles.shareBtn} onClick={() => handleShare('facebook')} aria-label="Share on Facebook" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </button>
            <button className={styles.shareBtn} onClick={() => handleShare('twitter')} aria-label="Share on Twitter" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
            </button>
            <button className={styles.shareBtn} onClick={() => handleShare('instagram')} aria-label="Copy link for Instagram" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </button>
          </div>

          <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Close">
            ✕ Close
          </button>
        </div>

        {toast && <div className={styles.toast} role="status">{toast}</div>}
      </div>
    </div>
  );
}
