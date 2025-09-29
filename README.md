# Bulk Image Converter

A free, fast, and secure bulk image converter that converts PNG, JPG, and WEBP images to optimized WEBP format. All processing happens locally on your device - no data leaves your computer.

## Features

- 🚀 **Fast Processing** - Convert multiple images simultaneously
- 💾 **Local Processing** - All conversion happens locally, no cloud storage
- 📦 **Bulk Download** - Download individual files or all at once in a ZIP
- 🎛️ **Quality Control** - Adjustable quality settings (10-100%)
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🎨 **Modern UI** - Clean, intuitive interface with drag-and-drop

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Clone or download this project
2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Upload Images**: Drag and drop images or click to select files
2. **Adjust Quality**: Use the slider to set compression quality (default: 80%)
3. **Convert**: Click "Convert & Download ZIP" to process all images
4. **Download**: Download individual files or the complete ZIP archive

## Supported Formats

- **Input**: PNG, JPG, WEBP
- **Output**: WEBP (optimized)

## Tech Stack

- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first CSS framework
- **Sharp** - High-performance image processing
- **JSZip** - Client-side ZIP file generation
- **TypeScript** - Type-safe development

## Privacy & Security

- ✅ All processing happens locally
- ✅ No data is sent to external servers
- ✅ No cloud storage or third-party services
- ✅ Completely free and open source

## Development

The project uses:

- `app/page.tsx` - Main application interface
- `app/api/convert/route.ts` - API endpoint for image conversion
- `app/layout.tsx` - Root layout with metadata
- `app/globals.css` - Global styles with Tailwind

## License

This project is open source and available under the MIT License.
