(function () {
  function track(name, params) {
    if (typeof gtag !== 'function') return;
    gtag('event', name, params);
  }

  var page = window.location.pathname;

  // ─── Click tracking ───────────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    var el = e.target.closest('a, button');
    if (!el) return;

    var text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').substring(0, 60);
    var href = el.getAttribute('href') || '';

    // Phone clicks
    if (href.startsWith('tel:')) {
      track('phone_clicked', { page: page });
      return;
    }

    // Email clicks
    if (href.startsWith('mailto:')) {
      track('email_clicked', { page: page });
      return;
    }

    // Give intent
    if (/give|donate|tithe|offering/i.test(text) || href.includes('give.html')) {
      track('give_intent', { button_text: text, page: page });
    }

    // Plan Your Visit intent
    if (/plan.*(your )?visit|first.*visit/i.test(text) || href.includes('plan-your-visit')) {
      track('plan_visit_clicked', { button_text: text, page: page });
    }

    // Watch Live intent
    if (/watch.*(live|online|now)|stream/i.test(text) || href.includes('watch-live')) {
      track('watch_live_clicked', { button_text: text, page: page });
    }

    // Blog article clicks
    if (href.includes('blog-posts/')) {
      var article = href.split('/').pop().replace('.html', '').replace(/-/g, ' ');
      track('blog_article_clicked', { article: article, page: page });
    }

    // Newsletter / mailing list
    if (/subscribe|newsletter|mailing list|stay connected/i.test(text)) {
      track('newsletter_intent', { button_text: text, page: page });
    }

    // Nav clicks
    if (el.closest('nav')) {
      track('nav_clicked', { link_text: text, destination: href, page: page });
    }

    // Contact intent
    if (/contact|get in touch|reach out|send.*message/i.test(text) || href.includes('contact.html')) {
      track('contact_clicked', { button_text: text, page: page });
    }

    // Ministry page clicks
    if (href.match(/ministries|tehillah|the-new-mc|mercy-kidz/)) {
      track('ministry_clicked', { ministry: text, destination: href, page: page });
    }

    // One Bring One / invite
    if (href.includes('one-bring-one') || /bring.*one|invite.*friend/i.test(text)) {
      track('invite_friend_clicked', { button_text: text, page: page });
    }

    // Community impact
    if (href.includes('community-impact')) {
      track('community_impact_clicked', { button_text: text, page: page });
    }
  });

  // ─── Form submissions ─────────────────────────────────────────────────────
  document.addEventListener('submit', function (e) {
    var form = e.target;
    var id = (form.id || form.getAttribute('name') || '').toLowerCase();
    var action = (form.action || '').toLowerCase();
    var type = 'other';

    if (page.includes('contact') || /contact/i.test(id)) type = 'contact';
    else if (page.includes('plan-your-visit') || /visit|plan/i.test(id)) type = 'plan_visit';
    else if (/mailchimp|newsletter|subscribe|list/i.test(id + action)) type = 'newsletter';
    else if (page.includes('give') || /give|donate/i.test(id)) type = 'give';
    else if (page.includes('one-bring-one') || /invite|bring/i.test(id)) type = 'invite';

    track('form_submitted', { form_type: type, page: page });
  });

})();
