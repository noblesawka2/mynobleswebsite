# Nobles Cooperative website

The public site remains framework-free HTML, CSS and vanilla JavaScript. A small Node build compiles shared navigation/footer partials and maps existing complete pages to canonical clean routes. The admin source is copied unchanged.

## Commands

```text
npm.cmd run build
npm.cmd run validate:html
npm.cmd run check:links
npm.cmd run lint
npm.cmd test
```

The deployable output is `dist/`. Internal visual fixtures are generated in `.build/fixtures/` and are intentionally outside the deployment directory.

## Creating a page

1. Choose a pattern in `src/templates/`: `product`, `institutional`, `partner`, `resource-listing`, `resource-detail`, `public-form`, `login`, or `portal`.
2. Add only approved content. Mark unverified claims `TODO: CONTENT APPROVAL` and do not publish them as facts.
3. Use `src/data/site.json` for routes and public contact/app details.
4. Add the page data and canonical output route to `scripts/build.mjs`.
5. Build, validate, check links, lint and test before deployment.

Shared chrome is compiled into every generated public HTML document; it does not use client-side `fetch()` and remains usable without JavaScript. JavaScript progressively enhances menus, dropdowns, tabs, FAQs and the back-to-top control.
