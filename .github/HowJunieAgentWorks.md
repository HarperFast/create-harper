### How JetBrains Junie Connects to Your Project

The system works as an automated loop between your GitHub repository, the JetBrains Junie GitHub App, and the GitHub Actions runner. Here is the step-by-step connection for your use case:

#### 1. The Trigger (Your Input)

When you perform one of the two actions you mentioned:

- **Create an Issue** with "junie" in the title.
- **Comment** on an issue with `@jetbrains-junie`.

The **JetBrains Junie GitHub App** (which you must install on your repo) receives a webhook notification from GitHub. It sees the trigger and identifies that you want help on this specific issue.

#### 2. The Workflow (`.github/workflows/junie.yml`)

Once triggered, the Junie backend sends a **`workflow_dispatch`** event to your repository. This is where your `junie.yml` file comes in:

- It serves as the "entry point" for the AI.
- The line `uses: jetbrains-junie/junie-workflows/.github/workflows/ej-issue.yml@main` tells GitHub to run Junie's standardized execution engine within _your_ repository's context.
- Because you gave it `contents: write` permissions, it can create branches and push code changes directly.

#### 3. The Environment (`.devcontainer/devcontainer.json`)

This is the most critical part for ensuring "it works on my machine" (where "machine" is the AI's temporary workspace):

- When the workflow starts, Junie looks for a `.devcontainer/devcontainer.json` file.
- It uses this file to **provision its own workspace**. Since you updated it to **Node.js 24**, Junie will spin up a container running Node 24.
- It also sees the `extensions` (dprint, vitest, oxlint) and `postCreateCommand` (`npm install`). This ensures that before Junie even reads your code, it has already installed the correct dependencies and is ready to run the tests and linters you've defined.

#### 4. The Guidelines (`.junie/guidelines.md`)

After the environment is ready, Junie reads your `.junie/guidelines.md`. This acts as the "Standard Operating Procedure" (SOP) for the AI. It tells Junie:

- "Don't just write code; make sure you run `npm run lint:fix`."
- "If you change common files, remember to run `npm run templates:apply-shared-templates`."
- "Look at `AGENTS.md` if you're confused about Harper's custom resources."

### Do I need to configure anything else?

1. **GitHub App Installation**: Ensure the [JetBrains Junie GitHub App](https://github.com/apps/jetbrains-junie) is installed on this specific repository (`HarperFast/create-harper`).
2. **Repository Settings**:
   - Go to **Settings > Actions > General**.
   - Under **Workflow permissions**, ensure **"Allow GitHub Actions to create and approve pull requests"** is checked. This allows Junie to submit its work as a PR for you to review.
3. **Secrets (Optional)**: If your tests or scripts require specific environment variables (like a Harper cluster URL or password), you should add them as **GitHub Actions Secrets**. However, for general scaffolding and linting, the current setup is sufficient.

### Summary of the Flow

`Issue Trigger` → `GitHub App Webhook` → `workflow_dispatch (junie.yml)` → `Spin up Container (devcontainer.json)` → `Read Instructions (guidelines.md)` → `Perform Task` → `Submit PR`.
