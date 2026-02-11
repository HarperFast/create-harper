# Serving Web Content with Harper

Harper provides two primary ways to include and serve HTTP web content such as HTML, CSS, JavaScript, and React applications. These methods are mutually exclusive.

## 1. Using the Static Plugin

The `static` plugin is the simplest way to serve static files. It maps a directory on your filesystem to your Harper REST endpoint.

### Configuration

Add the `static` configuration to your `config.yaml`:

```yaml
static:
  files: 'web/*'
```

### Usage

1. Create a `web` folder in your project root.
2. Place your static files (e.g., `index.html`, `styles.css`, `app.js`) inside the `web` folder.
3. Your files will be accessible from your REST endpoint. For example, if Harper is running on `http://localhost:9926/`, your `index.html` will be available at that address.

### Key Characteristics

- **Precedence**: Static files are searched first. If a matching file is found, it is served; otherwise, Harper proceeds to check your other resource and table APIs.
- **No Directory Listings**: Browsing the directory structure via the browser is not supported.
- **Simple Deployment**: Ideal for pre-built applications or simple static sites.

---

## 2. Using the Vite Plugin

The Vite plugin integrates Vite's development server directly into Harper, providing features like Hot Module Replacement (HMR) during development.

### Configuration

Add the Vite plugin to your `config.yaml`:

```yaml
'@harperfast/vite-plugin':
  package: '@harperfast/vite-plugin'
```

### Setup

This plugin expects a `vite.config.ts` and an `index.html` file in your project root. It handles rendering your app through Vite during development.

### Package Configuration

To use the Vite plugin effectively, you should configure your `package.json` with the appropriate scripts and dependencies.

#### Scripts

Copy these script examples to manage your development and deployment workflows:

```json
"scripts": {
  "dev": "harper run .",
  "build": "tsc -b && vite build",
  "build-and-deploy": "rm -Rf deploy && npm run build && mkdir deploy && mv web deploy/ && cp -R deploy-template/* deploy/ && dotenv -- npm run deploy-web && rm -Rf deploy",
  "deploy-web": "(cd deploy && harperdb deploy_component . project=web restart=rolling replicated=true)"
}
```

#### Dependencies and Overrides

Include the Vite plugin and other related dependencies in your `devDependencies`:

```bash
npm install --save-dev vite @harperfast/vite-plugin @vitejs/plugin-react dotenv-cli
```

### Deploying to Production

Vite's HMR server is meant for development, not production. For that, the `build-and-deploy` script above builds the Vite app into a `web` folder, places the static handler, and then deploys that subdirectory as a Harper app to production.

### Key Characteristics

- **Development Experience**: Provides Vite's HMR for a fast development cycle.
- **Integrated Rendering**: Automatically handles the rendering of your React/Vite app.
- **Mutual Exclusivity**: Use this approach **instead of** the static plugin if you want Vite integration.
