#!/bin/bash

# Exit on error
set -e

# 1. Environment variable validation
if [ -z "$CLI_TARGET" ]; then
  echo "Error: CLI_TARGET is not set."
  echo "Please set it in your .env file or environment."
  exit 1
fi

if [ -z "$CLI_USERNAME" ]; then
  echo "Error: CLI_USERNAME is not set."
  exit 1
fi

if [ -z "$CLI_PASSWORD" ]; then
  echo "Error: CLI_PASSWORD is not set."
  exit 1
fi

# 2. Log out the CLI_TARGET
echo "Deploying to: $CLI_TARGET"

# 3. Creation of a temp deployment directory
DEPLOY_DIR="deploy_tmp"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# 4. Handle transformations and file copying
# Default files to copy if they exist
# 4d. Use CLI_DEPLOY_FILES if provided, otherwise default
if [ -n "$CLI_DEPLOY_FILES" ]; then
  IFS=',' read -ra FILES_TO_COPY <<< "$CLI_DEPLOY_FILES"
  echo "Using custom deployment files: ${FILES_TO_COPY[*]}"
else
  FILES_TO_COPY=("schemas" "resources" "fastify" "config.yaml" "package.json")
fi

# Copy existing files/directories to temp dir
for item in "${FILES_TO_COPY[@]}"; do
  # Support for simple globs by letting the shell expand it before the loop
  # But since we are reading from env, it might be tricky.
  # For now, we assume simple names or already expanded globs if passed correctly.
  if [ -e "$item" ]; then
    cp -R "$item" "$DEPLOY_DIR/"
  fi
done

# If web directory exists (from build), copy it
if [ -d "web" ]; then
  cp -R "web" "$DEPLOY_DIR/"
fi

# Overlay deploy-template if it exists
if [ -d "deploy-template" ]; then
  cp -R deploy-template/* "$DEPLOY_DIR/"
fi

cd "$DEPLOY_DIR"

# 4a. Dependencies only in package.json (if it exists)
if [ -f "package.json" ]; then
  echo "Filtering package.json to production dependencies only..."
  # Use node to transform package.json
  node -e "
    const fs = require('fs');
    const { devDependencies, ...everythingElse } = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    fs.writeFileSync('package.json', JSON.stringify(everythingElse, null, 2));
  "
fi

# 4b & 4c. Transform config.yaml
if [ -f "config.yaml" ]; then
  echo "Transforming config.yaml..."
  # Simple transformations using sed or node.
  # Removing @harperfast/schema-codegen and @harperfast/vite-plugin
  node -e "
    const fs = require('fs');
    let config = fs.readFileSync('config.yaml', 'utf8');

    // 4b. Remove blocks for @harperfast/schema-codegen and @harperfast/vite-plugin
    config = config.replace(/'@harperfast\/schema-codegen':[\s\S]*?(?=\n\n|\n[^\s]|$)/g, '');
    config = config.replace(/'@harperfast\/vite-plugin':[\s\S]*?(?=\n\n|\n[^\s]|$)/g, '');

    // 4c. Add fastifyRoutes if we have a fastify directory
    if (fs.existsSync('fastify') && !config.includes('fastifyRoutes:')) {
      config += '\nfastifyRoutes:\n  files: fastify/*.js\n';
    }

    fs.writeFileSync('config.yaml', config.trim() + '\n');
  "
fi

# 5. Execute deployment
echo "Executing harper deploy_component..."
# We use the environment variables CLI_TARGET, CLI_USERNAME, CLI_PASSWORD which harper CLI respects
harper deploy_component . restart=rolling replicated=true project=web

# Cleanup
cd ..
rm -rf "$DEPLOY_DIR"

echo "Deployment complete!"
