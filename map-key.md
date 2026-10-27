How to Keep Keys Out of Your Public GitHub Repository

While the key is safe from unauthorized billing because of the referrer restriction, you should still avoid committing the raw string into your public Git history to keep your repository secure.

Strategy Option	Implementation Mechanism	Best Used For
GitHub Actions Secret Injection	Store the key safely in GitHub Repository Secrets. Use a basic GitHub Actions workflow to automatically swap a placeholder string (like __MAPS_API_KEY__) with your real key right before deploying to GitHub Pages.	Public open-source codebases where the raw key must never be seen in the main git branch history.
Runtime Fetch / Configuration File	Keep the key in a local configuration file ignored by Git (.gitignore). On deployment, fetch it from an independent serverless configuration point or a secondary un-indexed private file asset.	Rapid local prototyping or hybrid development setups.


Sequential Procedure: Implementing GitHub Actions Injection

If you want a secure build pipeline that keeps the key completely out of your main Git branches, use this procedure:
1. On GitHub, navigate to your repository -> Settings -> Secrets and variables -> Actions.
2. Create a New repository secret named MAPS_API_KEY and paste your actual Google API key as the value.
3. In your HTML file, swap out your raw key string for a distinct token placeholder:html
<script src="https://googleapis.com" async defer></script>
Use code with caution.
1. Create a deployment workflow file at .github/workflows/deploy.yml that replaces the placeholder during compilation:yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
      - name: Inject API Key
        run: |
          sed -i 's/GH_MAPS_KEY_PLACEHOLDER/${{ secrets.MAPS_API_KEY }}/g' index.html
      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: .
          branch: gh-pages
Use code with caution.
Would you like help setting up the GitHub Actions workflow file for your specific repository configuration, or would you like to double-check your URL wildcard formatting for the Google Cloud Console?
