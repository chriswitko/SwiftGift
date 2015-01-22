# Chris Witko for SwiftGift

Author:
Chris Witko
chris.witko@gmail.com

Screenshots: 
https://www.dropbox.com/sh/n8yq07dc9idfe69/AAB0bNQMtqgU8dxOUdZUIyWia?dl=0

Simple e-commerce app for Merchants to store products online.

# Installation & Quick Start

1. Unzip file swiftgift.zip into folder
2. Run: npm install
3. Check and update file: config/secrets.js
- Verify MongoDB connection
4. Run: node app.js
5. Visit app on http://localhost:5000

# Features

1. List products in catalog
2. List products by selected merchants
3. Filter product by merchant & category
4. Search products by query with simple typos
5. Adding products with title, image, price & multiple categories in one view
6. Editing product details
7. Clean & simple design based on bootstrap
8. Easy to deploy & extend with new modules
9. One click pagination
10. Running cluster_app.js allows you to take advantage of this feature by forking a process of app.js for each detected CPU.

# General

1. Merchant can add multiple products & categories
2. Merchant can create multiple categories
3. Each product have multiple categories
4. Merchant can create new categories on-the-fly in product view
5. Users can visit selected merchant, filter products by categories  or search by query with simple typos
6. Multiple merchants can signup - only email address is unique

# Search with simple typos - How it works?
My idea was to add ability to search for products even if user make enter simple typos. To do it, I'm using SoundEx and for every single product I create "typos" array.

This simple solutions give us extra functionality and increase search experience.

# Roadmap
- Removing single categories for all products
- List all merchants in one place with logo previews
- Dashboard for merchants with extra settings
- Reseting passwords / Removing account
- Removing products
- Send all statics & images to CDN (S3) - better performance and lower costs
- Product preview