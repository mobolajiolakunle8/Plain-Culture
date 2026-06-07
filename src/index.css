@import "tailwindcss";

/* Configure class-based dark mode selector explicitly for Tailwind CSS v4 */
@variant dark (&:where(.dark, .dark *));

@layer utilities {
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }

  @keyframes marquee {
    from {
      transform: translateX(0%);
    }
    to {
      transform: translateX(-50%);
    }
  }

  .animate-marquee {
    animation: marquee 40s linear infinite;
    will-change: transform;
  }

  .animate-marquee:hover {
    animation-play-state: paused;
  }
}

/* Base style overrides to guarantee bullet-proof theme toggle behaviour */
html {
  transition: background-color 0.3s ease, color 0.3s ease;
}

html.dark {
  background-color: #000000;
  color: #f4f4f5;
}

html:not(.dark) {
  background-color: #ffffff;
  color: #09090b;
}

/* Premium dark-mode minimalist custom scrollbar styles */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #3f3f46;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #E8FF6B;
}
