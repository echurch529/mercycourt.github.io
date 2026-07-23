(function () {
  'use strict';

  /* Decap CMS 3.x exports window.h directly; window.React may or may not
     be present depending on the build. Use whichever is available.        */
  var React = window.React;
  var h = (React && React.createElement) || window.h;

  if (!h) {
    console.error('[MC Preview] Neither window.React nor window.h found. ' +
      'Check that preview.js loads after decap-cms.js and that the CMS bundle is intact.');
    return;
  }

  /* ── Brand tokens (match event-page.njk inline values exactly) ── */
  var ORANGE  = '#E8541A';
  var NAVY    = '#1B2A4A';
  var BODY    = "'Lato', 'Helvetica Neue', Arial, sans-serif";
  var DISPLAY = "'Anton', Impact, 'Arial Narrow', sans-serif";

  /* ── Fonts: injected as <link> into the preview iframe ── */
  window.CMS.registerPreviewStyle(
    'https://fonts.googleapis.com/css2?family=Anton&family=Lato:wght@300;400;700&display=swap'
  );

  /* ── Tailwind CDN: injected into the preview iframe on first mount ──
     window.tailwind must be set before the CDN script executes so the
     custom color/font extensions are picked up on first scan.           */
  function injectTailwind() {
    if (document.getElementById('mc-tw-cdn')) return;
    window.tailwind = {
      config: {
        theme: {
          extend: {
            colors: {
              'brand-red':    '#D95A2B',
              'brand-dark':   '#0A0A0A',
              'brand-footer': '#1a1a1a'
            },
            fontFamily: {
              'anton': ['Anton', 'sans-serif'],
              'lato':  ['Lato', 'sans-serif']
            }
          }
        }
      }
    };
    var s = document.createElement('script');
    s.id  = 'mc-tw-cdn';
    s.src = 'https://cdn.tailwindcss.com';
    document.head.appendChild(s);
  }

  /* ── Image helper ──
     Absolute repo paths (/assets/...) resolve against mercycourt.org
     in the preview iframe and load directly without getAsset.
     For CMS-uploaded images that haven't been persisted yet,
     getAsset returns a blob URL — handle both cases.                   */
  function resolveImage(props, path) {
    if (!path) return '';
    if (path.charAt(0) === '/') return path;
    try {
      var a = props.getAsset(path);
      var url = a && a.toString ? a.toString() : '';
      return url || path;
    } catch (e) { return path; }
  }

  /* ══════════════════════════════════════════════════════════════════
     Section helpers — pure functions returning React elements.
     Each mirrors the {% if … %} guard in event-page.njk exactly.
     ══════════════════════════════════════════════════════════════════ */

  function Badge(text) {
    if (!text) return null;
    return h('span', {
      style: {
        display: 'inline-block',
        background: ORANGE,
        color: '#fff',
        padding: '6px 24px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '28px',
        fontFamily: BODY
      }
    }, text);
  }

  /* ── Hero (always rendered) ── */
  function HeroSection(props, hero) {
    return h('section', {
      style: {
        position: 'relative',
        overflow: 'hidden',
        height: '100vh',
        minHeight: '560px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    },
      h('img', {
        src: resolveImage(props, hero.image),
        alt: '',
        style: {
          position: 'absolute',
          top: 0, right: 0, bottom: 0, left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }
      }),
      h('div', {
        style: {
          position: 'absolute',
          top: 0, right: 0, bottom: 0, left: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.82), rgba(0,0,0,0.5), rgba(0,0,0,0.22))'
        }
      }),
      h('div', {
        style: {
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '0 24px',
          maxWidth: '860px',
          margin: '0 auto'
        }
      },
        Badge(hero.badge),
        h('h1', {
          style: {
            fontFamily: DISPLAY,
            fontSize: 'clamp(48px, 8vw, 88px)',
            textTransform: 'uppercase',
            color: '#fff',
            lineHeight: '1',
            letterSpacing: '-0.01em',
            margin: '0 0 24px'
          }
        }, hero.headline || ''),
        h('p', {
          style: {
            fontFamily: BODY,
            color: 'rgba(255,255,255,0.9)',
            fontSize: '18px',
            lineHeight: '1.7',
            maxWidth: '600px',
            margin: '0 auto 40px'
          }
        }, hero.subheadline || ''),
        h('div', { style: { display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' } },
          h('span', {
            style: {
              background: ORANGE,
              color: '#fff',
              padding: '14px 40px',
              borderRadius: '999px',
              fontFamily: BODY,
              fontWeight: '700',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }
          }, hero.primary_cta || 'PLAN MY VISIT'),
          hero.secondary_cta_text && h('span', {
            style: {
              border: '2px solid #fff',
              color: '#fff',
              padding: '14px 40px',
              borderRadius: '999px',
              fontFamily: BODY,
              fontWeight: '700',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }
          }, hero.secondary_cta_text)
        )
      )
    );
  }

  /* ── Welcome / Message (optional: hidden when heading blank) ── */
  function WelcomeSection(props, welcome) {
    if (!welcome || !welcome.heading) return null;
    return h('section', {
      style: { background: '#fff', padding: '96px 24px', textAlign: 'center' }
    },
      h('div', { style: { maxWidth: '800px', margin: '0 auto' } },
        Badge(welcome.badge),
        h('h2', {
          style: {
            fontFamily: DISPLAY,
            fontSize: 'clamp(32px, 5vw, 48px)',
            textTransform: 'uppercase',
            color: NAVY,
            letterSpacing: '-0.01em',
            margin: '0 0 36px'
          }
        }, welcome.heading),
        (welcome.body || []).map(function (para, i) {
          return h('p', {
            key: i,
            style: { fontFamily: BODY, fontSize: '17px', color: '#4b5563', lineHeight: '1.8', marginBottom: '20px' }
          }, para);
        }),
        h('span', {
          style: {
            display: 'inline-block',
            marginTop: '32px',
            background: ORANGE,
            color: '#fff',
            padding: '16px 48px',
            borderRadius: '999px',
            fontFamily: BODY,
            fontWeight: '700',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }
        }, 'PLAN MY VISIT')
      )
    );
  }

  /* ── Feature Cards (optional: hidden when cards list is empty) ── */
  function FeaturesSection(props, features) {
    var cards = features.cards || [];
    if (!cards.length) return null;
    return h('section', { style: { background: '#F5F5F5', padding: '96px 24px' } },
      h('div', { style: { maxWidth: '960px', margin: '0 auto' } },
        h('div', { style: { textAlign: 'center', marginBottom: '56px' } },
          Badge(features.badge),
          features.heading && h('h2', {
            style: {
              fontFamily: DISPLAY,
              fontSize: 'clamp(32px, 5vw, 48px)',
              textTransform: 'uppercase',
              color: NAVY,
              letterSpacing: '-0.01em'
            }
          }, features.heading)
        ),
        h('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '28px'
          }
        },
          cards.map(function (card, i) {
            return h('div', {
              key: i,
              style: {
                background: '#fff',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }
            },
              h('div', { style: { fontSize: '48px', marginBottom: '20px' } }, card.emoji),
              h('h3', {
                style: {
                  fontFamily: DISPLAY,
                  fontSize: '22px',
                  textTransform: 'uppercase',
                  color: NAVY,
                  marginBottom: '12px'
                }
              }, card.title),
              h('p', {
                style: { fontFamily: BODY, fontSize: '15px', color: '#4b5563', lineHeight: '1.7' }
              }, card.body)
            );
          })
        )
      )
    );
  }

  /* ── Testimonials / Social Proof (optional: hidden when heading blank) ── */
  function TestimonialsSection(props, testimonials) {
    if (!testimonials || !testimonials.heading) return null;
    var quotes = testimonials.quotes || [];
    var cols = quotes.length <= 1 ? '1fr'
             : quotes.length === 2 ? 'repeat(2, 1fr)'
             : 'repeat(3, 1fr)';

    return h('section', {
      style: { background: NAVY, padding: '96px 24px', textAlign: 'center' }
    },
      h('div', { style: { maxWidth: '960px', margin: '0 auto' } },
        Badge('STORIES'),
        h('h2', {
          style: {
            fontFamily: DISPLAY,
            fontSize: 'clamp(32px, 5vw, 48px)',
            textTransform: 'uppercase',
            color: '#fff',
            letterSpacing: '-0.01em',
            margin: '0 0 12px'
          }
        }, testimonials.heading),
        testimonials.subheading && h('p', {
          style: { fontFamily: BODY, color: 'rgba(255,255,255,0.7)', fontSize: '17px', marginBottom: '56px' }
        }, testimonials.subheading),

        /* Video or placeholder */
        h('div', {
          style: {
            maxWidth: '700px',
            margin: '0 auto 56px',
            borderRadius: '16px',
            overflow: 'hidden',
            aspectRatio: '16 / 9'
          }
        },
          testimonials.video_url
            ? h('iframe', {
                src: testimonials.video_url,
                frameBorder: '0',
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
                allowFullScreen: true,
                style: { width: '100%', height: '100%', display: 'block' }
              })
            : h('div', {
                style: {
                  width: '100%',
                  height: '100%',
                  background: '#0F1E35',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  aspectRatio: '16 / 9',
                  minHeight: '200px'
                }
              },
                h('div', {
                  style: {
                    width: '72px', height: '72px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                    border: '2px solid rgba(255,255,255,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                },
                  h('svg', {
                    style: { width: '36px', height: '36px', color: '#fff', marginLeft: '4px' },
                    fill: 'currentColor',
                    viewBox: '0 0 24 24'
                  },
                    h('path', { d: 'M8 5v14l11-7z' })
                  )
                ),
                h('p', {
                  style: { fontFamily: BODY, color: 'rgba(255,255,255,0.5)', fontSize: '13px' }
                }, 'Video testimonial coming soon')
              )
        ),

        /* Quote cards */
        quotes.length > 0 && h('div', {
          style: { display: 'grid', gridTemplateColumns: cols, gap: '20px', textAlign: 'left' }
        },
          quotes.map(function (q, i) {
            return h('div', {
              key: i,
              style: {
                background: '#fff',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
              }
            },
              h('div', {
                style: {
                  fontSize: '48px',
                  fontWeight: '900',
                  color: ORANGE,
                  lineHeight: '1',
                  marginBottom: '14px',
                  fontFamily: BODY
                }
              }, '“'),
              h('p', {
                style: {
                  fontFamily: BODY,
                  color: '#374151',
                  fontSize: '15px',
                  lineHeight: '1.7',
                  fontStyle: 'italic',
                  marginBottom: '24px'
                }
              }, q.quote),
              h('p', {
                style: { fontFamily: BODY, fontWeight: '700', fontSize: '13px', color: ORANGE }
              }, '— ' + (q.attribution || ''))
            );
          })
        )
      )
    );
  }

  /* ── Service Logistics (optional: hidden when heading blank) ── */
  function LogisticsSection(props, logistics) {
    if (!logistics || !logistics.heading) return null;
    var col = { textAlign: 'center' };
    var iconStyle = { fontSize: '44px', marginBottom: '16px' };
    var labelStyle = {
      fontFamily: BODY, fontWeight: '700', color: '#fff',
      fontSize: '13px', textTransform: 'uppercase',
      letterSpacing: '0.08em', marginBottom: '10px'
    };
    var valueStyle = {
      fontFamily: BODY, color: 'rgba(255,255,255,0.9)',
      lineHeight: '1.7', fontSize: '15px'
    };

    return h('section', { style: { background: ORANGE, padding: '96px 24px', textAlign: 'center' } },
      h('div', { style: { maxWidth: '900px', margin: '0 auto' } },
        h('h2', {
          style: {
            fontFamily: DISPLAY,
            fontSize: 'clamp(32px, 5vw, 48px)',
            textTransform: 'uppercase',
            color: '#fff',
            letterSpacing: '-0.01em',
            marginBottom: '56px'
          }
        }, logistics.heading),
        h('div', {
          style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '36px', marginBottom: '48px' }
        },
          h('div', { style: col },
            h('div', { style: iconStyle }, '📍'),
            h('h3', { style: labelStyle }, 'Location'),
            h('p', { style: valueStyle }, '529 Walker Avenue', h('br'), 'Baltimore, MD 21212')
          ),
          h('div', { style: col },
            h('div', { style: iconStyle }, '🕙'),
            h('h3', { style: labelStyle }, 'Sunday Service'),
            h('p', { style: valueStyle }, '10:00 AM', h('br'), 'Every Sunday')
          ),
          h('div', { style: col },
            h('div', { style: iconStyle }, '🅿️'),
            h('h3', { style: labelStyle }, 'Parking'),
            h('p', { style: valueStyle }, 'Free parking', h('br'), 'Available on site')
          )
        ),
        logistics.custom_note && h('p', {
          style: { fontFamily: BODY, color: 'rgba(255,255,255,0.9)', fontSize: '15px', marginBottom: '28px' }
        }, logistics.custom_note),
        h('span', {
          style: {
            display: 'inline-block',
            background: '#fff',
            color: ORANGE,
            padding: '18px 56px',
            borderRadius: '999px',
            fontFamily: BODY,
            fontWeight: '700',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }
        }, 'PLAN MY VISIT')
      )
    );
  }

  /* ── Giving / Donation (optional: hidden when heading blank) ── */
  function GivingSection(props, giving) {
    if (!giving || !giving.heading) return null;
    return h('section', { style: { background: '#fff', padding: '96px 24px', textAlign: 'center' } },
      h('div', { style: { maxWidth: '700px', margin: '0 auto' } },
        h('h2', {
          style: {
            fontFamily: DISPLAY,
            fontSize: 'clamp(32px, 5vw, 48px)',
            textTransform: 'uppercase',
            color: NAVY,
            letterSpacing: '-0.01em',
            marginBottom: '36px'
          }
        }, giving.heading),
        giving.body && h('p', {
          style: { fontFamily: BODY, fontSize: '17px', color: '#4b5563', lineHeight: '1.8', marginBottom: '48px' }
        }, giving.body),
        h('span', {
          style: {
            display: 'inline-block',
            background: ORANGE,
            color: '#fff',
            padding: '18px 56px',
            borderRadius: '999px',
            fontFamily: BODY,
            fontWeight: '700',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }
        }, giving.button_text || 'Give Now')
      )
    );
  }

  /* ── Final CTA (optional: hidden when heading blank) ── */
  function CTAFinalSection(props, ctaFinal) {
    if (!ctaFinal || !ctaFinal.heading) return null;
    return h('section', { style: { background: '#fff', padding: '96px 24px', textAlign: 'center' } },
      h('div', { style: { maxWidth: '700px', margin: '0 auto' } },
        h('h2', {
          style: {
            fontFamily: DISPLAY,
            fontSize: 'clamp(32px, 5vw, 48px)',
            textTransform: 'uppercase',
            color: NAVY,
            letterSpacing: '-0.01em',
            marginBottom: '36px'
          }
        }, ctaFinal.heading),
        (ctaFinal.body || []).map(function (para, i) {
          return h('p', {
            key: i,
            style: { fontFamily: BODY, fontSize: '17px', color: '#4b5563', lineHeight: '1.8', marginBottom: '20px' }
          }, para);
        }),
        h('span', {
          style: {
            display: 'inline-block',
            marginTop: '28px',
            background: ORANGE,
            color: '#fff',
            padding: '18px 56px',
            borderRadius: '999px',
            fontFamily: BODY,
            fontWeight: '700',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }
        }, ctaFinal.button_text || 'PLAN MY VISIT')
      )
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     Event Pages Preview Component
     Registered for the 'events' folder collection.
     Functional component — no React.Component dependency.
     ══════════════════════════════════════════════════════════════════ */
  function EventPagePreview(props) {
    injectTailwind();

    try {
      var entry = props.entry;
      var rawData = entry.get('data');
      if (!rawData) return h('div', { style: { padding: '40px', fontFamily: BODY, color: '#888' } }, 'Loading preview…');

      var data = rawData.toJS ? rawData.toJS() : {};

      var hero         = data.hero        || {};
      var welcome      = data.welcome     || {};
      var features     = data.features    || {};
      var testimonials = data.testimonials || {};
      var logistics    = data.logistics   || {};
      var giving       = data.giving      || {};
      var ctaFinal     = data.cta_final   || {};

      return h('div', { style: { fontFamily: BODY, background: '#fff', margin: 0, padding: 0 } },
        /* Preview notice bar */
        h('div', {
          style: {
            background: '#111',
            color: '#666',
            fontSize: '11px',
            fontFamily: BODY,
            padding: '7px 16px',
            textAlign: 'center',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }
        }, 'Preview — nav, footer, and modal not shown'),

        HeroSection(props, hero),
        WelcomeSection(props, welcome),
        FeaturesSection(props, features),
        TestimonialsSection(props, testimonials),
        LogisticsSection(props, logistics),
        GivingSection(props, giving),
        CTAFinalSection(props, ctaFinal)
      );
    } catch (err) {
      return h('div', {
        style: { padding: '32px', fontFamily: 'monospace', fontSize: '13px', color: '#c00', background: '#fff1f1' }
      }, 'Preview error: ' + err.message);
    }
  }

  window.CMS.registerPreviewTemplate('events', EventPagePreview);

}());
