# Jade Room Website

A lightweight Netlify-ready website for Jade Room with editable content files and a Decap CMS admin screen.

## What is editable

- Homepage hero, intro and events text
- Address, phone, email and booking links
- Opening hours
- Menu items, descriptions and prices

Editable content lives in `content/site.json` and `content/menu.json`.

## CMS setup notes

The CMS entry point is `/admin/`. Before publishing, update `admin/config.yml`:

- `repo`: your GitHub repository, for example `jackiecheng/jade-room-website`
- `site_url`: the final Netlify site URL
- `display_url`: the final Netlify site URL

The current backend is set to GitHub. For browser editing, Decap CMS needs GitHub authentication configured for the published site.

## Local preview

Serve the folder locally and open the preview URL in a browser. Because the site reads JSON content files, it should be viewed through a local server rather than by opening `index.html` directly.
