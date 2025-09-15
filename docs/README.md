# PrivateVote FHEVM Documentation

📚 VitePress documentation site for the PrivateVote confidential voting dApp.

## Quick Start

```bash
npm install
npm run dev
```

Visit **http://localhost:5173** to view the documentation.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production  
npm run preview  # Preview production build
```

## Content Structure

- `index.md` - Homepage with project overview
- `getting-started.md` - Quick setup guide
- `architecture.md` - Technical architecture
- `smart-contracts.md` - Contract implementation details
- `security.md` - Security analysis and best practices
- `deployment.md` - Production deployment guide

## Building for Production

```bash
npm run build
```

Output will be in `.vitepress/dist/`

## Deployment

### Vercel
```bash
# Build command: npm run build
# Output directory: .vitepress/dist
```

### Netlify  
```bash
# Build command: npm run build
# Publish directory: .vitepress/dist
```

### GitHub Pages
```bash
# Enable GitHub Pages in repository settings
# Select "GitHub Actions" as source
# VitePress GitHub Actions will auto-deploy
```

## Contributing

1. Edit markdown files directly
2. Test locally with `npm run dev`
3. Commit changes
4. Documentation auto-deploys on push

---

**Built with [VitePress](https://vitepress.dev/)**
