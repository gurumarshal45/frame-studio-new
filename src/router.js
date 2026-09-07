import './style.css';

const path = location.pathname.replace(/\/$/, '') || '/';

if (['/', '/admin', '/portfolio'].includes(path)) {
  if (path === '/portfolio') document.body.classList.add('portfolio-page');
  import('./app.js');
} else {
  const media = '/media/';
  const pages = {
    '/about': {
      label: 'About Frame Studio', title: 'People first.<br><em>Pictures second.</em>', image: 'wedding-portrait.png',
      body: `<section class="page-split"><div><p class="section-number">OUR APPROACH</p><h2>We photograph<br>how it felt.</h2></div><div><p>Frame Studio was built around one simple idea: wedding photographs should feel honest. We look for the gestures, laughter, traditions, and relationships that make every celebration personal.</p><p>Our approach is calm and observant. We offer gentle direction when it helps, then step back so real moments have room to happen.</p></div></section><section class="values"><article><b>01</b><h3>Candid by nature</h3><p>We notice moments without interrupting them.</p></article><article><b>02</b><h3>Cinematic in detail</h3><p>Light, movement, and sound shape every story.</p></article><article><b>03</b><h3>Personal throughout</h3><p>One thoughtful team from planning to delivery.</p></article></section>`
    },
    '/services': {
      label: 'Photography & Film', title: 'Wedding services,<br><em>made personal.</em>', image: 'wedding-celebration.png',
      body: `<section class="page-intro"><p class="section-number">WHAT WE CREATE</p><h2>Coverage for every chapter.</h2><p>Choose photography, film, or a complete team for one event or a multi-day celebration.</p></section><section class="service-cards"><article><span>01</span><h3>Full Wedding Coverage</h3><p>From getting ready through the final celebration, with candid photography, family portraits, and carefully edited images.</p><a href="/contact">Ask about coverage →</a></article><article><span>02</span><h3>Pre-Wedding Shoots</h3><p>A relaxed portrait experience designed around your connection, preferred mood, and meaningful locations.</p><a href="/contact">Plan your session →</a></article><article><span>03</span><h3>Multi-Day Weddings</h3><p>One visual story across haldi, mehendi, sangeet, ceremony, reception, and every gathering between.</p><a href="/contact">Build your schedule →</a></article><article><span>04</span><h3>Wedding Films</h3><p>Cinematic highlights and longer films combining natural sound, vows, speeches, movement, and atmosphere.</p><a href="/contact">Explore film options →</a></article></section>`
    },
    '/packages': {
      label: 'Collections', title: 'Simple packages.<br><em>Flexible stories.</em>', image: 'wedding-portrait.png',
      body: `<section class="page-intro"><p class="section-number">PACKAGES</p><h2>Begin with what you need.</h2><p>Every wedding is different. These starting collections can be adjusted after we understand your events, locations, and priorities.</p></section><section class="package-grid"><article><p>ESSENTIAL</p><h3>One-Day Story</h3><ul><li>One wedding event</li><li>Candid and traditional photography</li><li>Professionally edited digital gallery</li><li>Private online delivery</li></ul><a href="/contact">Request pricing →</a></article><article class="featured"><p>SIGNATURE</p><h3>Photo + Film</h3><ul><li>Full-day photography team</li><li>Cinematic highlight film</li><li>Complete ceremony coverage</li><li>Edited gallery and digital films</li></ul><a href="/contact">Request pricing →</a></article><article><p>CELEBRATION</p><h3>Multi-Day Story</h3><ul><li>Coverage across multiple events</li><li>Photography and film team</li><li>Planning consultation</li><li>Custom gallery and film collection</li></ul><a href="/contact">Build a package →</a></article></section><p class="package-note">Final pricing depends on dates, team size, travel, coverage hours, films, and album choices.</p>`
    },
    '/destination': {
      label: 'Destination Weddings', title: 'Your people.<br><em>Anywhere in the world.</em>', image: 'wedding-hero.png',
      body: `<section class="page-split"><div><p class="section-number">DESTINATION STORIES</p><h2>Travel changes the view,<br>not the feeling.</h2></div><div><p>Whether your celebration unfolds in a palace, beside the sea, or in a quiet family home, we arrive prepared to tell the complete story.</p><p>We help plan coverage around travel, changing light, multiple venues, local traditions, and the rhythm of a destination celebration.</p><a class="underlined" href="/contact">Discuss your destination →</a></div></section><section class="destination-strip"><div><small>01</small><h3>Before</h3><p>Timeline, venue, travel, and visual planning.</p></div><div><small>02</small><h3>During</h3><p>Complete candid coverage without disrupting events.</p></div><div><small>03</small><h3>After</h3><p>Careful editing, films, galleries, and album options.</p></div></section>`
    },
    '/blog': {
      label: 'Journal', title: 'Stories, ideas<br><em>& wedding guidance.</em>', image: 'wedding-celebration.png',
      body: `<section class="blog-grid"><article><img src="${media}wedding-portrait.png" alt="Wedding portrait"><p>PLANNING · 6 MIN READ</p><h3>What to ask your wedding photographer before booking</h3><span>A practical guide to style, timelines, deliverables, backup plans, and choosing the right team.</span></article><article><img src="${media}wedding-celebration.png" alt="Wedding celebration"><p>TRADITIONS · 7 MIN READ</p><h3>Planning photography for a multi-day Indian wedding</h3><span>How to build coverage across rituals while keeping the experience comfortable and natural.</span></article><article><img src="${media}wedding-hero.png" alt="Destination wedding"><p>DESTINATIONS · 5 MIN READ</p><h3>Choosing the right setting for a pre-wedding session</h3><span>Think about light, travel, clothing, privacy, and the kind of story you want the images to tell.</span></article></section>`
    },
    '/contact': {
      label: 'Contact Frame Studio', title: 'Tell us about<br><em>your celebration.</em>', image: 'wedding-hero.png',
      body: `<section class="contact-page"><div><p class="section-number">START A CONVERSATION</p><h2>We would love to hear your plans.</h2><p>Share your date, location, events, and the kind of coverage you are looking for. We will reply with availability and the next steps.</p><div class="contact-details"><a href="tel:+918790042094">+91 87900 42094</a><a href="mailto:sivaganesh152002@gmail.com">sivaganesh152002@gmail.com</a><a href="https://wa.me/918790042094" target="_blank" rel="noopener">WhatsApp us →</a></div></div><form class="enquiry-form" action="mailto:sivaganesh152002@gmail.com" method="post" enctype="text/plain"><label>Your name<input name="name" required></label><label>Email<input type="email" name="email" required></label><label>Phone<input type="tel" name="phone"></label><label>Event date<input type="date" name="date"></label><label>Event location<input name="location"></label><label>Tell us about your celebration<textarea name="message" rows="5" required></textarea></label><button class="primary" type="submit">Send enquiry →</button></form></section>`
    }
  };

  const page = pages[path] || pages['/about'];
  document.title = `${page.label} — Frame Studio`;
  const nav = `<header class="inner-header"><a class="brand" href="/"><span class="brand-script">Frame</span><span class="brand-studio">STUDIO</span></a><button class="menu-toggle" aria-label="Open navigation" aria-expanded="false">Menu</button><nav><a href="/">Home</a><a href="/about">About</a><a href="/portfolio">Portfolio</a><a href="/services">Services</a><a href="/packages">Packages</a><a href="/destination">Destination</a><a href="/blog">Blog</a><a href="/contact">Contact</a><a class="quote-link" href="/contact">Get a quote</a></nav></header>`;
  const footer = `<footer class="site-footer"><div class="footer-about"><a class="brand" href="/"><span class="brand-script">Frame</span><span class="brand-studio">STUDIO</span></a><p>Real, cinematic wedding photographs and films made for people who value feeling over perfection.</p></div><div><h3>Main links</h3><a href="/">Home →</a><a href="/about">About →</a><a href="/services">Services →</a><a href="/portfolio">Portfolio →</a></div><div><h3>Photography services</h3><a href="/services">Wedding Photography →</a><a href="/services">Pre-Wedding Shoots →</a><a href="/services">Multi-Day Coverage →</a><a href="/destination">Destination Weddings →</a></div><div><h3>Reach us</h3><a href="tel:+918790042094">+91 87900 42094</a><a href="mailto:sivaganesh152002@gmail.com">sivaganesh152002@gmail.com</a><a href="https://wa.me/918790042094" target="_blank" rel="noopener">Chat on WhatsApp →</a></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Frame Studio</span><span>Photography & cinematic films</span></div></footer>`;
  document.body.innerHTML = `${nav}<main class="inner-main"><section class="page-hero"><img src="${media}${page.image}" alt=""><div></div><p>${page.label}</p><h1>${page.title}</h1></section>${page.body}</main>${footer}<a class="whatsapp-float" href="https://wa.me/918790042094" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">WA</a>`;
  const toggle = document.querySelector('.menu-toggle');
  toggle.onclick = () => { const open = document.querySelector('header').classList.toggle('menu-open'); toggle.setAttribute('aria-expanded', String(open)); };
  const form = document.querySelector('.enquiry-form');
  if (form) form.onsubmit = event => {
    event.preventDefault();
    const data = new FormData(form);
    const subject = encodeURIComponent(`Wedding enquiry from ${data.get('name')}`);
    const body = encodeURIComponent(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone')}\nEvent date: ${data.get('date')}\nLocation: ${data.get('location')}\n\n${data.get('message')}`);
    location.href = `mailto:sivaganesh152002@gmail.com?subject=${subject}&body=${body}`;
  };
}
