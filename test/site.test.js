'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { renderSite } = require('../scripts/build.js');
const yaml = require('../static/js/js-yaml.min.js');
const root = path.resolve(__dirname, '..');
const config = yaml.load(fs.readFileSync(path.join(root, 'contents/config.yml'), 'utf8'));
const siteUrl = new URL(config['site-url']);

test('the initial HTML contains each content section, current list entries and links without JavaScript', () => {
    const html = renderSite()['index.html'];
    for (const section of ['home', 'publications', 'awards']) {
        const body = html.match(new RegExp(`<div class="main-body" id="${section}-md">([\\s\\S]*?)</div>`))[1];
        const markdown = fs.readFileSync(path.join(root, `contents/${section}.md`), 'utf8');
        assert.ok(body.trim().length > 0, `Empty section ${section}`);
        assert.equal((body.match(/<li>/g) || []).length, (markdown.match(/^- /gm) || []).length);
        for (const [, link] of markdown.matchAll(/\]\(([^)\s]+)\)/g)) {
            assert.ok(body.includes(link), `Missing content link ${link}`);
        }
    }
    assert.doesNotMatch(html, /\{\{[a-z_]+\}\}/);
});

test('search metadata, one main heading, unique IDs and local asset links are valid', () => {
    const files = renderSite();
    const html = files['index.html'];
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.ok(html.includes(`<link rel="canonical" href="${siteUrl.href}"`));
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    const person = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(person['@type'], 'Person');
    assert.equal(person.url, siteUrl.href);
    assert.ok(files['robots.txt'].includes(`Sitemap: ${siteUrl.href}sitemap.xml`));
    assert.ok(files['sitemap.xml'].includes(`<loc>${siteUrl.href}</loc>`));
    for (const [, link] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        if (link.startsWith('#')) assert.ok(ids.includes(link.slice(1)), `Missing anchor ${link}`);
        else if (!/^https?:\/\//.test(link)) assert.ok(fs.existsSync(path.join(root, link)), `Missing asset ${link}`);
    }
});

test('rendering has no external CSS, duplicate stylesheet import or blocking JavaScript', () => {
    const html = renderSite()['index.html'];
    assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"[^>]+href="https?:/);
    assert.doesNotMatch(html, /MathJax|marked\.min\.js|js-yaml\.min\.js/);
    for (const [, attrs] of html.matchAll(/<script\b([^>]*\bsrc="[^"]+"[^>]*)>/g)) {
        assert.match(attrs, /\bdefer\b/);
    }
    const css = fs.readFileSync(path.join(root, 'static/css/main.css'), 'utf8');
    assert.doesNotMatch(css, /@import/);
    for (const [, font] of css.matchAll(/url\("\.\.\/assets\/fonts\/([^"]+)"\)/g)) {
        const fontPath = path.join(root, 'static/assets/fonts', font);
        assert.equal(fs.readFileSync(fontPath).subarray(0, 4).toString(), 'wOF2');
        const license = path.join(root, 'static/assets/fonts', font.replace('-latin.woff2', '-OFL.txt'));
        assert.match(fs.readFileSync(license, 'utf8'), /SIL OPEN FONT LICENSE/);
    }
    const runtime = fs.readFileSync(path.join(root, 'static/js/scripts.js'), 'utf8');
    assert.doesNotMatch(runtime, /\bfetch\s*\(|MathJax|marked|jsyaml/);
});

function runCounter(hostname) {
    const scripts = [];
    const container = { style: { display: 'none' } };
    const stats = { dataset: { hostname: siteUrl.hostname } };
    const window = {
        location: { hostname },
        addEventListener(event, callback) { assert.equal(event, 'DOMContentLoaded'); this.ready = callback; }
    };
    const document = {
        body: { appendChild: script => scripts.push(script) },
        querySelector: () => null, querySelectorAll: () => [],
        getElementById: id => id === 'site-stats' ? stats : container,
        createElement: tag => { assert.equal(tag, 'script'); return {}; }
    };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'static/js/scripts.js'), 'utf8'), { window, document });
    window.ready();
    return { scripts, container };
}

test('local and preview hosts do not contact the production counter', () => {
    for (const host of ['localhost', '127.0.0.1', '::1', 'preview.example.com', 'bwzhaocodes.github.io.example.com']) {
        assert.equal(runCounter(host).scripts.length, 0, host);
    }
});

test('the production domain loads one asynchronous counter and hides it on failure', () => {
    const { scripts, container } = runCounter(siteUrl.hostname);
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].async, true);
    assert.equal(scripts[0].src, 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js');
    container.style.display = 'inline';
    scripts[0].onerror();
    assert.equal(container.style.display, 'none');
});
