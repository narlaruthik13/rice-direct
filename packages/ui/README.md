# @kisa/ui

Shared React components for the Next.js apps (web, admin). Shipped as TypeScript source:
each app lists `@kisa/ui` in `transpilePackages` and adds `../../packages/ui/src/**/*.tsx`
to its Tailwind `content`.

- `@kisa/ui/logo`: the website logo, with the optional animated grain drop (framer-motion).
- `@kisa/ui/logo-static`: the same logo with no animation library, for server components and small bundles (admin).
