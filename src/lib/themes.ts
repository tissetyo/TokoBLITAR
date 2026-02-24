export interface StoreTheme {
    id: string
    name: string
    primaryColor: string
    background: string
    cardBg: string
    textColor: string
    secondaryTextColor: string
    buttonClasses: string
}

export const STORE_THEMES: StoreTheme[] = [
    // --- LIGHT & MINIMAL ---
    {
        id: 'minimal_light',
        name: 'Minimal Light',
        primaryColor: '#2563eb', // Blue
        background: 'bg-slate-50',
        cardBg: 'bg-white border hover:shadow-md transition-shadow',
        textColor: 'text-slate-900',
        secondaryTextColor: 'text-slate-500',
        buttonClasses: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    },
    {
        id: 'clean_monochrome',
        name: 'Clean Monochrome',
        primaryColor: '#0f172a', // Slate 900
        background: 'bg-white',
        cardBg: 'bg-white border-2 border-slate-100 hover:border-slate-300 transition-colors',
        textColor: 'text-black',
        secondaryTextColor: 'text-gray-500',
        buttonClasses: 'bg-black hover:bg-gray-800 text-white',
    },
    {
        id: 'warm_sand',
        name: 'Warm Sand',
        primaryColor: '#9a3412', // Orange 800
        background: 'bg-[#faf6f0]',
        cardBg: 'bg-white border-[#f3e8d6] hover:shadow-sm border',
        textColor: 'text-[#4a3f35]',
        secondaryTextColor: 'text-[#8a7f75]',
        buttonClasses: 'bg-[#9a3412] hover:bg-[#7c2d12] text-white',
    },
    {
        id: 'soft_pastel_pink',
        name: 'Soft Pink',
        primaryColor: '#db2777', // Rose 600
        background: 'bg-pink-50',
        cardBg: 'bg-white shadow-sm border border-pink-100 hover:border-pink-300',
        textColor: 'text-slate-800',
        secondaryTextColor: 'text-pink-600/70',
        buttonClasses: 'bg-pink-500 hover:bg-pink-600 text-white shadow-sm',
    },
    {
        id: 'mint_fresh',
        name: 'Mint Fresh',
        primaryColor: '#059669', // Emerald 600
        background: 'bg-emerald-50/50',
        cardBg: 'bg-white border border-emerald-100 shadow-sm',
        textColor: 'text-slate-800',
        secondaryTextColor: 'text-emerald-700/70',
        buttonClasses: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },

    // --- DARK & SLEEK ---
    {
        id: 'midnight_dark',
        name: 'Midnight Dark',
        primaryColor: '#3b82f6', // Blue 500
        background: 'bg-slate-950',
        cardBg: 'bg-slate-900 border border-slate-800 hover:border-slate-700',
        textColor: 'text-white',
        secondaryTextColor: 'text-slate-400',
        buttonClasses: 'bg-blue-600 hover:bg-blue-500 text-white',
    },
    {
        id: 'obsidian_gold',
        name: 'Obsidian Gold',
        primaryColor: '#fbbf24', // Amber 400
        background: 'bg-[#0a0a0a]',
        cardBg: 'bg-[#171717] border border-[#262626] hover:border-amber-500/50',
        textColor: 'text-[#fbbf24]',
        secondaryTextColor: 'text-gray-400',
        buttonClasses: 'bg-amber-500 hover:bg-amber-400 text-black font-semibold',
    },
    {
        id: 'deep_forest',
        name: 'Deep Forest',
        primaryColor: '#10b981', // Emerald 500
        background: 'bg-[#022c22]', // Teal 950
        cardBg: 'bg-[#064e3b] border border-[#065f46]',
        textColor: 'text-emerald-50',
        secondaryTextColor: 'text-emerald-200/70',
        buttonClasses: 'bg-emerald-500 hover:bg-emerald-400 text-teal-950 font-bold',
    },
    {
        id: 'neon_cyberpunk',
        name: 'Cyberpunk',
        primaryColor: '#f43f5e', // Rose 500
        background: 'bg-indigo-950',
        cardBg: 'bg-black border border-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.5)] transition-shadow',
        textColor: 'text-white',
        secondaryTextColor: 'text-rose-400',
        buttonClasses: 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.8)]',
    },
    {
        id: 'purple_dracula',
        name: 'Dracula',
        primaryColor: '#bd93f9',
        background: 'bg-[#282a36]',
        cardBg: 'bg-[#44475a] border-none',
        textColor: 'text-[#f8f8f2]',
        secondaryTextColor: 'text-[#6272a4]',
        buttonClasses: 'bg-[#6272a4] hover:bg-[#bd93f9] text-white hover:text-black',
    },

    // --- VIBRANT GRADIENTS ---
    {
        id: 'sunset_gradient',
        name: 'Sunset Orange',
        primaryColor: '#ea580c',
        background: 'bg-gradient-to-br from-orange-400 to-rose-500',
        cardBg: 'bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30',
        textColor: 'text-white',
        secondaryTextColor: 'text-orange-50',
        buttonClasses: 'bg-white text-rose-600 hover:bg-orange-50 font-bold',
    },
    {
        id: 'ocean_breeze',
        name: 'Ocean Breeze',
        primaryColor: '#0284c7',
        background: 'bg-gradient-to-br from-cyan-400 to-blue-600',
        cardBg: 'bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20',
        textColor: 'text-white',
        secondaryTextColor: 'text-cyan-100',
        buttonClasses: 'bg-white text-blue-700 hover:bg-cyan-50 font-bold shadow-lg',
    },
    {
        id: 'lavender_dream',
        name: 'Lavender Dream',
        primaryColor: '#7c3aed',
        background: 'bg-gradient-to-tr from-violet-500 to-fuchsia-400',
        cardBg: 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-none hover:-translate-y-1 transition-transform',
        textColor: 'text-slate-800',
        secondaryTextColor: 'text-slate-500',
        buttonClasses: 'bg-violet-600 hover:bg-violet-700 text-white',
    },
    {
        id: 'aurora_borealis',
        name: 'Aurora',
        primaryColor: '#14b8a6',
        background: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500',
        cardBg: 'bg-black/30 backdrop-blur-md border border-white/10 hover:bg-black/40',
        textColor: 'text-white',
        secondaryTextColor: 'text-teal-100',
        buttonClasses: 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold',
    },
    {
        id: 'mango_papaya',
        name: 'Mango Papaya',
        primaryColor: '#eab308',
        background: 'bg-gradient-to-br from-yellow-400 to-orange-500',
        cardBg: 'bg-white border-none shadow-xl hover:shadow-2xl transition-shadow rounded-2xl',
        textColor: 'text-orange-950',
        secondaryTextColor: 'text-orange-800/70',
        buttonClasses: 'bg-gray-900 hover:bg-black text-white',
    },

    // --- ELEGANT & GLASSMORPHISM ---
    {
        id: 'frosted_glass_light',
        name: 'Frosted Light',
        primaryColor: '#334155',
        background: 'bg-[url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")] bg-cover bg-center bg-fixed',
        cardBg: 'bg-white/40 backdrop-blur-xl border border-white/50 shadow-lg hover:bg-white/50',
        textColor: 'text-slate-900',
        secondaryTextColor: 'text-slate-700',
        buttonClasses: 'bg-white/80 hover:bg-white text-slate-900 backdrop-blur-sm shadow-sm',
    },
    {
        id: 'frosted_glass_dark',
        name: 'Frosted Dark',
        primaryColor: '#cbd5e1',
        background: 'bg-[url("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop")] bg-cover bg-center bg-fixed',
        cardBg: 'bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl hover:bg-black/50',
        textColor: 'text-white',
        secondaryTextColor: 'text-gray-300',
        buttonClasses: 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md',
    },
    {
        id: 'marble_luxury',
        name: 'Marble Luxury',
        primaryColor: '#b45309', // Amber 700 (Gold-ish)
        background: 'bg-slate-100',
        cardBg: 'bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-amber-100/50 hover:shadow-[0_10px_40px_-5px_rgba(0,0,0,0.2)] transition-shadow rounded-none',
        textColor: 'text-slate-900',
        secondaryTextColor: 'text-amber-800/60',
        buttonClasses: 'bg-slate-900 hover:bg-black text-white rounded-none border border-slate-700',
    },
    {
        id: 'brutalism',
        name: 'Brutalism',
        primaryColor: '#000000',
        background: 'bg-[#f4f4f0]',
        cardBg: 'bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all rounded-none',
        textColor: 'text-black',
        secondaryTextColor: 'text-gray-800 font-bold',
        buttonClasses: 'bg-black text-white hover:bg-white hover:text-black border-4 border-black rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-x-0 translate-y-0 hover:translate-x-1 hover:translate-y-1 transition-all',
    },
    {
        id: 'retro_arcade',
        name: 'Retro Arcade',
        primaryColor: '#39ff14', // Neon green
        background: 'bg-[#111111] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]',
        cardBg: 'bg-black border-2 border-[#39ff14] shadow-[0_0_15px_rgba(57,255,20,0.4)] hover:shadow-[0_0_25px_rgba(57,255,20,0.7)]',
        textColor: 'text-[#39ff14]',
        secondaryTextColor: 'text-[#39ff14]/70',
        buttonClasses: 'bg-transparent hover:bg-[#39ff14]/20 border-2 border-[#39ff14] text-[#39ff14] shadow-[0_0_10px_rgba(57,255,20,0.4)]',
    }
]

export interface StoreFont {
    id: string
    name: string
    fontClass: string
}

export const STORE_FONTS: StoreFont[] = [
    { id: 'font-sans', name: 'Inter (Modern Sans)', fontClass: 'font-sans' },
    { id: 'font-serif', name: 'Playfair (Elegant Serif)', fontClass: 'font-serif' },
    { id: 'font-mono', name: 'Roboto Mono (Code/Tech)', fontClass: 'font-mono' },
    // You can add more Google Fonts by importing them in layout.tsx and referencing their CSS variables here
    // But Tailwind's defaults cover the basics nicely. We can extend tailwind.config.ts if strictly needed.
]

export function getTheme(id: string): StoreTheme {
    return STORE_THEMES.find(t => t.id === id) || STORE_THEMES[0]
}

export function getFont(id: string): StoreFont {
    return STORE_FONTS.find(f => f.id === id) || STORE_FONTS[0]
}
