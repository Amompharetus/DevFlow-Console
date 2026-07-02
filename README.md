# DevFlow Console

**DevFlow Console** is a lightweight, zero-config interactive CLI automation panel designed for developers managing multiple local projects or microservices in a unified workspace. 

It consolidates repository health checks, environment setup bootstrapping, and recursive build cache purges into a single interactive terminal dashboard.

---

## Key Features

1. **🔍 Multi-Repository Scanner**
   Scans your parent directory to identify active Git repositories, displaying their branch name, uncommitted changes (created/modified/deleted), and synchronization metrics against upstream branches (ahead/behind counts).
2. **🧹 Cache & Dependency Janitor**
   Safely and recursively deletes package caches (`node_modules`), lockfiles (`package-lock.json`, `yarn.lock`), and build directories (`dist`, `.next`, `build`) in parallel across chosen projects.
3. **🔄 Environment Sync Tool**
   Checks for `.env.example` templates and syncs missing environment variables into local `.env` files automatically without overwriting existing keys.
4. **🚀 Batch Upstream Puller**
   Performs parallelized git pulls across all repositories with inline progress spinners.

---

## Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v16.0.0 or higher recommended)
* [Git](https://git-scm.com/) installed and configured on your system

### Installation
1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/your-username/devflow-console.git
   ```
2. Navigate into the directory and install dependencies:
   ```bash
   cd devflow-console
   npm install
   ```

---

## Usage

Start the interactive dashboard by running:
```bash
npm start
```

### Dashboard Interface:
* Use the **arrow keys** to navigate options.
* Press **Space** to select/deselect items in multiselect views (e.g. choosing projects to clean).
* Press **Enter** to confirm actions.

---

## Technologies Used
* **[Node.js](https://nodejs.org/)** - Core execution runtime environment.
* **[simple-git](https://github.com/steveukx/node-simple-git)** - Modern wrapper interface for Git commands.
* **[prompts](https://github.com/terkelg/prompts)** - Visual, user-friendly interactive CLI selections.
* **[chalk](https://github.com/chalk/chalk)** - Terminal string styling engine for rich color formatting.
* **[ora](https://github.com/sindresorhus/ora)** - Clean graphical terminal loading spinners.

---

## License
Distributed under the MIT License. See `LICENSE` for more information.
