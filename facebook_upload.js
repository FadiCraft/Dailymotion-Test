name: Global Auto Post (TikTok & Facebook)

on:
  workflow_dispatch:

jobs:
  post_job:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Dependencies
        run: |
          npm install axios puppeteer-extra puppeteer-extra-plugin-stealth puppeteer
          npx puppeteer browsers install chrome

      - name: Run TikTok Upload
        env:
          TIKTOK_COOKIES: ${{ secrets.TIKTOK_COOKIES }}
        run: node upload.js

      - name: Run Facebook Upload
        env:
          FACEBOOK_COOKIES: ${{ secrets.FACEBOOK_COOKIES }}
        run: node facebook_upload.js

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: post-reports
          path: |
            final-result.png
            facebook-result.png
            *-error.png
