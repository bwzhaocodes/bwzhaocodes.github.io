'use strict';

window.addEventListener('DOMContentLoaded', () => {
    const mainNav = document.querySelector('#mainNav');
    if (mainNav && window.bootstrap) {
        new bootstrap.ScrollSpy(document.body, { target: '#mainNav', offset: 74 });
    }

    const navbarToggler = document.querySelector('.navbar-toggler');
    document.querySelectorAll('#navbarResponsive .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navbarToggler && window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // Local previews and pull-request previews must not send visits to the live counter.
    const stats = document.getElementById('site-stats');
    if (stats && window.location.hostname === stats.dataset.hostname) {
        const counter = document.createElement('script');
        counter.async = true;
        counter.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
        counter.onerror = () => {
            document.getElementById('busuanzi_container_site_pv').style.display = 'none';
        };
        document.body.appendChild(counter);
    }
});
