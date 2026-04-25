'use client';
import React from 'react';
import { EnrichmentItem } from '@/lib/gemini';

interface EnrichmentBlockProps {
  videos: EnrichmentItem[];
  articles: EnrichmentItem[];
}

/**
 * Converts a YouTube watch or youtu.be URL to an embed URL.
 * Returns the original URL if it doesn't match known patterns.
 */
export function toEmbedUrl(url: string): string {
  // Handle https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/https:\/\/www\.youtube\.com\/watch\?v=([^&\s]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  // Handle https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/https:\/\/youtu\.be\/([^?\s]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }
  return url;
}

export default function EnrichmentBlock({ videos, articles }: EnrichmentBlockProps) {
  if (videos.length === 0 && articles.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-3">
      {videos.length > 0 && (
        <div className="bg-[#0a0a14] border-pixel p-3">
          <p className="text-[10px] text-[#fcd34d] uppercase tracking-widest mb-2 font-bold">
            📺 RELATED VIDEOS
          </p>
          <div className="space-y-3">
            {videos.map((video, i) => (
              <div key={i}>
                <p className="text-[10px] text-[#e0e0e0] uppercase mb-1 truncate">
                  {video.title}
                </p>
                <iframe
                  src={toEmbedUrl(video.url)}
                  title={video.title}
                  className="w-full aspect-video border-2 border-[#4a4a6a]"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {articles.length > 0 && (
        <div className="bg-[#0a0a14] border-pixel p-3">
          <p className="text-[10px] text-[#fcd34d] uppercase tracking-widest mb-2 font-bold">
            📖 RELATED ARTICLES
          </p>
          <ul className="space-y-2">
            {articles.map((article, i) => (
              <li key={i}>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#fcd34d] underline hover:text-[#fbbf24] uppercase transition-colors"
                >
                  {article.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
