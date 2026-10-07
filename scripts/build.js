'use strict';

const fs = require('node:fs');
const path = require('node:path');
const marked = require('../static/js/marked.min.js');
const yaml = require('../static/js/js-yaml.min.js');

const root = path.resolve(__dirname, '..');
const sections = ['home', 'publications', 'awards'];
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

function renderSite(source = root) {
    const config = yaml.load(fs.readFileSync(path.join(source, 'contents/config.yml'), 'utf8'));
    const required = ['title', 'description', 'site-url', 'page-top-title',
        'top-section-bg-text', 'home-subtitle', 'copyright-text'];
    for (const key of required) {
        if (typeof config[key] !== 'string' || !config[key].trim()) {
            throw new Error(`contents/config.yml must contain a non-empty ${key}`);
        }
    }
    const siteUrl = new URL(config['site-url']);
    if (siteUrl.protocol !== 'https:' || siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash) {
        throw new Error('site-url must be an HTTPS site root, without a query or fragment');
    }
    const url = siteUrl.href;
    const image = new URL('static/assets/img/photo.jpg', url).href;
    const person = {
        '@context': 'https://schema.org', '@type': 'Person',
        name: 'Bowen Zhao', alternateName: '赵博文', url, image,
        sameAs: ['https://github.com/bwzhaocodes']
    };
    const values = {
        title: escapeHtml(config.title), description: escapeHtml(config.description),
        site_url: escapeHtml(url), social_image: escapeHtml(image),
        hostname: escapeHtml(siteUrl.hostname),
        page_top_title: escapeHtml(config['page-top-title']),
        top_section_bg_text: escapeHtml(config['top-section-bg-text']),
        home_subtitle: escapeHtml(config['home-subtitle']),
        copyright_text: escapeHtml(config['copyright-text']),
        // JSON in a script element must not be able to terminate that element.
        person_json: JSON.stringify(person).replace(/</g, '\\u003c')
    };
    for (const section of sections) {
        const markdown = fs.readFileSync(path.join(source, `contents/${section}.md`), 'utf8');
        if (!markdown.trim()) throw new Error(`contents/${section}.md is empty`);
        values[`${section}_html`] = marked.parse(markdown, { mangle: false, headerIds: false });
    }
    const template = fs.readFileSync(path.join(source, 'templates/index.html'), 'utf8');
    const html = template.replace(/\{\{([a-z_]+)\}\}/g, (_, key) => {
        if (!(key in values)) throw new Error(`Unknown template value: ${key}`);
        return values[key];
    });
    return {
        'index.html': html,
        'robots.txt': `User-agent: *\nAllow: /\n\nSitemap: ${url}sitemap.xml\n`,
        'sitemap.xml': `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${escapeHtml(url)}</loc></url>\n</urlset>\n`,
        '.nojekyll': ''
    };
}

function build(destination = root) {
    const files = renderSite();
    fs.mkdirSync(destination, { recursive: true });
    for (const [name, contents] of Object.entries(files)) {
        fs.writeFileSync(path.join(destination, name), contents);
    }
    if (path.resolve(destination) !== root) {
        // Publish only assets used by the site, not Markdown, templates or build libraries.
        for (const directory of ['assets', 'css']) {
            fs.cpSync(path.join(root, 'static', directory), path.join(destination, 'static', directory), {
                recursive: true,
                filter: filename => !['.DS_Store', 'background.jpeg'].includes(path.basename(filename))
            });
        }
        fs.mkdirSync(path.join(destination, 'static/js'), { recursive: true });
        for (const filename of ['bootstrap.bundle.min.js', 'scripts.js']) {
            fs.copyFileSync(path.join(root, 'static/js', filename), path.join(destination, 'static/js', filename));
        }
    }
    console.log(`Built complete HTML, sitemap and robots.txt in ${path.relative(root, destination) || '.'}`);
}

if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) build();
    else if (args.length === 2 && args[0] === '--output') build(path.resolve(root, args[1]));
    else throw new Error('Usage: node scripts/build.js [--output DIRECTORY]');
}

module.exports = { renderSite, build };
