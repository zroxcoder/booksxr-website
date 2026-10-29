# openglix static site

## Local testing
Do not open index.html directly with file:// because the site loads JSON with fetch.
Run:

    python -m http.server 8080

Then open:

    http://localhost:8080

## Add a new APK
1. Copy the new APK into the `apk/` folder.
2. Open `data/apps.json`.
3. Add a new object to the `apps` array:

    {
      "id": "myapp",
      "name": "My App",
      "version": "1.0.0",
      "apkFile": "apk/MyApp-v1.0.0.apk",
      "size": "12 MB",
      "date": "2026-11-01",
      "description": "Short description.",
      "changelog": [
        "Initial release"
      ]
    }

The APK Downloads page and FAQ page will update automatically, including the QR code.

## Add an update or blog post
Open `data/updates.json` and add an object to the top of the `posts` array:

    {
      "id": "unique-post-id",
      "type": "update",
      "date": "2026-11-01",
      "dateLabel": "November 1, 2026",
      "title": "Post title",
      "excerpt": "Short summary shown on cards.",
      "readTime": "3 min read",
      "author": "openglix Team",
      "tags": ["Updates", "Guides"],
      "content": [
        "First paragraph.",
        "Second paragraph."
      ]
    }

The home page shows the latest 3 posts. The Updates & Blog page shows all posts and filters by tags.

## Deploy
Upload the entire `openglix` folder to any static host. Make sure `.apk` files are served as downloads. If your host serves them as text, add a MIME type:

    application/vnd.android.package-archive

## QR codes
QR codes are generated automatically from each app's `apkFile` path. Keep `js/qrcode.min.js` in place.