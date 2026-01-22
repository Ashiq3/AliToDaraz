# AliToDaraz - Alibaba to Daraz Price Comparison 🛍️

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

**AliToDaraz** is a powerful Chrome Extension that helps dropshippers and shoppers instantly compare product prices between **Alibaba.com** and **Daraz Bangladesh**.

It uses advanced **Visual Search technology** (powered by Google Lens) to find the exact same product on Daraz, even if the titles are completely different!

![Screenshot](https://via.placeholder.com/800x400?text=AliToDaraz+App+Screenshot)
*(Replace with actual screenshot)*

## ✨ Features

- 🔍 **Visual Search**: Automatically finds products by image matching (no more keyword guessing!)
- 🕵️ **Hidden Processing**: Visual search runs invisibly in the background - no annoying tabs opening.
- ⚡ **Instant Comparison**: View Daraz prices directly on the Alibaba product page.
- 🇧🇩 **Localized**: optimized specifically for Daraz BD.
- 🔒 **Privacy Focused**: No personal data collection, runs 100% locally.

## 🚀 Installation

Since this is an open-source tool, you can install it manually in Developer Mode:

1. **Download** the `ali-to-daraz-package-v3.zip` from the [Releases page](#).
2. **Extract** the zip file to a folder.
3. Open Chrome and go to `chrome://extensions`.
4. Enable **Developer Mode** (toggle in top-right corner).
5. Click **Load Unpacked**.
6. Select the folder you extracted.
7. Done! You should see the **AD** icon in your toolbar.

## 📖 How to Use

1. Go to any product page on [Alibaba.com](https://www.alibaba.com/).
2. Look for the floating **"Compare on Daraz"** button (bottom right) or click the extension icon.
3. The sidebar will open and automatically search for the product on Daraz using visual matching.
4. Compare prices and verify profitability!

## 🛠️ Development Setup

Want to contribute? Great! Here is how to set up the project locally:

### Prerequisites

- Node.js (v18+)
- pnpm

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/ali-to-daraz-extension.git
cd ali-to-daraz-extension

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev
# This will watch for changes and rebuild automatically
```

### Build for Production

```bash
pnpm build
# Generates the 'dist' folder ready for deployment
```

## 🤝 Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Disclaimer**: This project is not affiliated with Alibaba Group or Daraz Group. It is a third-party tool developed for educational and productivity purposes.
