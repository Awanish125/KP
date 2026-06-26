This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.




# Kiran Publicity - Next.js Project Setup

## Step 1 - Create Project

```bash
npx create-next-app@latest kiran-publicity
```

Choose:

```
TypeScript → Yes
ESLint → Yes
Tailwind CSS → Yes
src directory → Yes
App Router → Yes
Turbopack → Yes
Import Alias → @/*
```

or

```bash
npx create-next-app@latest kiran-publicity --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Move into project

```bash
cd kiran-publicity
```

---

# Essential Packages

## 1. GSAP

```bash
npm install gsap
```

Purpose

* Premium animations
* Scroll animations
* Timeline animations
* Image reveals
* Hero animations
* Parallax
* Text animations

This will be the primary animation engine.

---

## 2. Lenis

```bash
npm install lenis
```

Purpose

Provides buttery smooth scrolling.

Why

Without Lenis scrolling feels like a normal website.

With Lenis

* Smooth momentum
* Premium feel
* Better ScrollTrigger synchronization

---

## 3. Framer Motion

```bash
npm install framer-motion
```

Purpose

React component animations.

Use for

* Button animation
* Modal animation
* Mobile menu
* Card entrance
* Hover effects
* Page transitions

Do NOT use for heavy scroll animations.

GSAP should handle those.

---

## 4. SplitType

```bash
npm install split-type
```

Purpose

Splits text into

* Characters
* Words
* Lines

Used for

Hero heading animation

Example

Making

↓

M a k i n g

Perfect for GSAP timelines.

---

## 5. React Icons

```bash
npm install react-icons
```

Purpose

Huge icon collection.

Use for

* Social Icons
* Menu Icons
* Contact Icons

---

## 6. Lucide React

```bash
npm install lucide-react
```

Purpose

Beautiful modern icons.

Use throughout UI.

---

## 7. clsx

```bash
npm install clsx
```

Purpose

Conditionally join class names.

Example

```ts
clsx(
  "rounded-xl",
  active && "bg-blue-500"
)
```

---

## 8. tailwind-merge

```bash
npm install tailwind-merge
```

Purpose

Merge conflicting Tailwind classes.

Useful when building reusable components.

---

## 9. class-variance-authority

```bash
npm install class-variance-authority
```

Purpose

Create reusable button variants.

Example

Button

Primary

Secondary

Outline

Ghost

Danger

All from one component.

---

## 10. next-themes

```bash
npm install next-themes
```

Purpose

Dark Mode

Light Mode

System Theme

Smooth switching.

---

## 11. React Hook Form

```bash
npm install react-hook-form
```

Purpose

Best React form library.

Use for

Contact Form

Quote Form

Career Form

Newsletter

---

## 12. Zod

```bash
npm install zod @hookform/resolvers
```

Purpose

Validation.

Example

Email

Phone

Budget

Campaign Type

---

## 13. React CountUp

```bash
npm install react-countup
```

Purpose

Animated counters.

Projects

Cities

Clients

Experience

---

## 14. Swiper

```bash
npm install swiper
```

Purpose

Testimonials

Gallery

Project Slider

Logo Slider

---

## 15. React Fast Marquee

```bash
npm install react-fast-marquee
```

Purpose

Infinite moving client logos.

Perfect for

Clients

Partners

Awards

---

## 16. React Simple Maps

```bash
npm install react-simple-maps
```

Purpose

Interactive India Map.

Will be used for

Coverage

Campaign Network

Cities

---

## 17. D3

```bash
npm install d3
```

Purpose

Animation

SVG Paths

Connection Lines

Moving Dots

Glowing Routes

India Map Animation

---

## 18. React Intersection Observer

```bash
npm install react-intersection-observer
```

Purpose

Detect when sections become visible.

Useful for

Counters

Animations

Lazy Loading

---

## 19. Lottie React

```bash
npm install lottie-react
```

Purpose

JSON animations.

Examples

Loading

Success

Icons

Empty State

---

## 20. React Parallax Tilt

```bash
npm install react-parallax-tilt
```

Purpose

3D Card Effect.

Perfect for

Service Cards

Project Cards

Team Cards

---

## 21. Sonner

```bash
npm install sonner
```

Purpose

Beautiful toast notifications.

Example

Message Sent

Quote Submitted

Error

---

# UI Library

Install Shadcn UI

```bash
npx shadcn@latest init
```

Choose

```
New York Style

Slate Base Color

CSS Variables → Yes
```

Install components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add sheet
npx shadcn@latest add accordion
npx shadcn@latest add navigation-menu
npx shadcn@latest add tabs
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add form
npx shadcn@latest add dropdown-menu
npx shadcn@latest add tooltip
npx shadcn@latest add carousel
npx shadcn@latest add separator
npx shadcn@latest add sonner
```

---

# Development Tools

Prettier

```bash
npm install -D prettier prettier-plugin-tailwindcss
```

Purpose

Automatically format code.

---

# Recommended Folder Structure

```
src/

app/
components/
    ui/
    layout/
    sections/
    animations/
    common/
hooks/
lib/
providers/
styles/
types/
utils/
constants/
data/
assets/
public/
```

---

# How Each Library Will Be Used

GSAP

✔ Hero Animation

✔ Scroll Storytelling

✔ Section Pinning

✔ Text Reveal

✔ Image Reveal

✔ Timeline Animation

✔ Parallax

✔ Mouse Movement

✔ Billboard Animation

✔ India Map Lines

---

Lenis

✔ Smooth Scrolling

✔ Premium Scroll Feel

---

Framer Motion

✔ Buttons

✔ Cards

✔ Modals

✔ Navigation

✔ Page Transition

---

SplitType

✔ Hero Heading

✔ Section Heading Animation

---

React CountUp

✔ Statistics

✔ Numbers

---

React Simple Maps

✔ India Coverage Map

---

D3

✔ Animated Connection Lines

✔ Pulsing Dots

✔ SVG Animations

---

Swiper

✔ Testimonials

✔ Gallery

✔ Projects

---

React Fast Marquee

✔ Client Logos

✔ Partner Logos

---

React Hook Form

✔ Contact Form

✔ Quote Form

---

Zod

✔ Validation

---

next-themes

✔ Dark Mode

✔ Light Mode

---

Lottie

✔ Loading Screen

✔ Success Animation

---

React Parallax Tilt

✔ Service Cards

✔ Project Cards

---

Sonner

✔ Toast Messages

---

# Start Development

```bash
npm run dev
```

This setup gives you a production-ready foundation for building a premium, highly animated website with Next.js, Tailwind CSS, GSAP, Lenis, and modern React best practices.
