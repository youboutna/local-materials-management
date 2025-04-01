
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Adrar region inspired color palette
				sandstone: {
					50: '#F9F6F0',
					100: '#F3EDE1',
					200: '#E8DBC4',
					300: '#D9C8AA',
					400: '#C9B691',
					500: '#B9A378',
					600: '#A99064',
					700: '#8A7551',
					800: '#6B5B3F',
					900: '#4C412D',
				},
				terracotta: {
					50: '#F9E7E0',
					100: '#F4CFC0',
					200: '#EA9E81',
					300: '#D97C57',
					400: '#C85F3D',
					500: '#B85030',
					600: '#994329',
					700: '#793520',
					800: '#5A2818',
					900: '#3A1A10',
				},
				adrar: {
					50: '#F2EFE6',
					100: '#E5DFCD',
					200: '#CCBF9B',
					300: '#B29F69',
					400: '#998547',
					500: '#7F6B2F',
					600: '#695A27',
					700: '#53481F',
					800: '#3D3617',
					900: '#27240F',
				},
				ivory: {
					50: '#FFFFFF',
					100: '#FCFAF7',
					200: '#F9F7F2',
					300: '#F6F1EB',
					400: '#F0E9E0',
					500: '#E9E0D5',
					600: '#D9C8B3',
					700: '#C8B091',
					800: '#B7986F',
					900: '#A6804D',
				},
				gold: {
					50: '#FEF6E1',
					100: '#FCEDC2',
					200: '#F9DB86',
					300: '#F5C84A',
					400: '#E8B53A',
					500: '#C19434',
					600: '#9F782B',
					700: '#7D5D22',
					800: '#5B4319',
					900: '#392A0F',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				'fade-out': {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' },
				},
				'slide-up': {
					'0%': { transform: 'translateY(30px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				'slide-down': {
					'0%': { transform: 'translateY(-30px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(30px)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out',
				'fade-out': 'fade-out 0.4s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				'slide-down': 'slide-down 0.4s ease-out',
				'scale-in': 'scale-in 0.4s ease-out',
				'slide-in-right': 'slide-in-right 0.4s ease-out',
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				serif: ['Lora', 'Amiri', 'Playfair Display', 'Georgia', 'serif'],
			},
			backgroundImage: {
				'stone-pattern': "url('/img/stone-bg.png')",
				'sand-texture': "url('/img/sand-texture.png')",
				'adrar-pattern': "url('/img/adrar-pattern.png')",
				'desert-gradient': "linear-gradient(to bottom, #E5DFCD, #F2EFE6)",
			},
			boxShadow: {
				'soft': '0 10px 50px -12px rgba(0, 0, 0, 0.05)',
				'elegant': '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
				'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
