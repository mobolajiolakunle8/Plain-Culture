import React from "react";
import { useSettings } from "../context/AppContext";
import { ArrowLeft, Shield } from "lucide-react";

interface ReturnPolicyPageProps {
  onNavigateBack: () => void;
}

export const ReturnPolicyPage: React.FC<ReturnPolicyPageProps> = ({ onNavigateBack }) => {
  const settings = useSettings();

  // Parse the markdown-like content into sections
  const sections = settings.returnPolicyContent.split("\n\n").filter(Boolean);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-12">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-2 text-[#E8FF6B] hover:opacity-80 font-bold uppercase tracking-widest text-sm mb-6 transition-opacity cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Shop</span>
          </button>

          <div className="flex items-start gap-3 mb-6">
            <Shield className="w-8 h-8 text-[#E8FF6B] shrink-0" />
            <div>
              <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-black dark:text-white mb-2">
                {settings.returnPolicyTitle}
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 uppercase tracking-widest font-semibold">
                Plain Culture's Commitment to Quality
              </p>
            </div>
          </div>
        </div>

        {/* Policy Content */}
        <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-8 md:p-12 space-y-8">
          {sections.map((section, idx) => {
            const lines = section.split("\n");
            const isTitle = lines[0].startsWith("**") && lines[0].endsWith("**");

            if (isTitle) {
              return (
                <div key={idx} className="space-y-3">
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-black dark:text-white border-b-2 border-[#E8FF6B] pb-2">
                    {lines[0].replace(/\*\*/g, "")}
                  </h2>
                  {lines.slice(1).map((line, lineIdx) => {
                    if (line.startsWith("•")) {
                      return (
                        <div key={lineIdx} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          <span className="text-[#E8FF6B] font-bold text-lg mt-1">•</span>
                          <span>{line.substring(1).trim()}</span>
                        </div>
                      );
                    } else if (line.match(/^\d+\./)) {
                      const match = line.match(/^\d+\.\s*(.*)/);
                      return (
                        <div key={lineIdx} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                          <span className="text-[#E8FF6B] font-bold min-w-fit">{line.split(" ")[0]}</span>
                          <span>{match?.[1] || line}</span>
                        </div>
                      );
                    }
                    return (
                      <p key={lineIdx} className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {line}
                      </p>
                    );
                  })}
                </div>
              );
            }

            return (
              <div key={idx} className="space-y-2">
                {lines.map((line, lineIdx) => {
                  if (line.trim() === "") return null;
                  if (line.startsWith("•")) {
                    return (
                      <div key={lineIdx} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        <span className="text-[#E8FF6B] font-bold text-lg">•</span>
                        <span>{line.substring(1).trim()}</span>
                      </div>
                    );
                  }
                  return (
                    <p key={lineIdx} className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {line}
                    </p>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm p-8 text-center">
          <h3 className="text-xl font-black uppercase tracking-wider text-black dark:text-white mb-3">
            Questions About Our Policy?
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            Our team is here to help. Reach out via WhatsApp or email for any inquiries.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`https://wa.me/${settings.phone.replace(/\+/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 bg-[#E8FF6B] text-black font-extrabold uppercase tracking-widest text-xs rounded-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              WhatsApp Us
            </a>
            <a
              href={`mailto:${settings.email}`}
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-extrabold uppercase tracking-widest text-xs rounded-sm hover:opacity-90 transition-opacity cursor-pointer"
            >
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
