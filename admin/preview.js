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
     Always ask getAsset first: for media that was just uploaded in this
     CMS session it returns a local blob URL, which is the ONLY way the
     image can render before the upload commit is deployed. (Skipping
     getAsset for absolute /assets/... paths made freshly uploaded images
     404 against the live site until the next deploy — the preview looked
     like it wasn't refreshing.) For already-deployed media, getAsset
     resolves back to the public path, so behavior there is unchanged.   */
  function resolveImage(props, path) {
    if (!path) return '';
    try {
      var a = props.getAsset(path);
      var url = a && a.toString ? a.toString() : '';
      if (url) return url;
    } catch (e) { /* fall through to raw path */ }
    return path;
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

  /* ── Hero (always rendered) ──
     Two modes, mirroring event-page.njk: text mode when badge/headline/
     subheadline present; flyer mode (image as centerpiece over a blurred
     backdrop) when all three are blank.                                  */
  function HeroSection(props, hero) {
    var imgSrc = resolveImage(props, hero.image);
    var ctaRow = h('div', { style: { display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '40px' } },
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
    );

    if (!hero.badge && !hero.headline && !hero.subheadline) {
      return h('section', {
        style: {
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '104px 24px 88px'
        }
      },
        h('img', {
          src: imgSrc,
          alt: '',
          'aria-hidden': true,
          style: {
            position: 'absolute',
            top: 0, right: 0, bottom: 0, left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(28px) brightness(0.4)',
            transform: 'scale(1.1)'
          }
        }),
        h('div', { style: { position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' } },
          h('img', {
            src: imgSrc,
            alt: hero.image_alt || '',
            style: { maxHeight: '72vh', maxWidth: '100%', width: 'auto', borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }
          }),
          ctaRow
        )
      );
    }

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
        alt: hero.image_alt || '',
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

  /* ── Countdown Timer (optional: hidden when countdown_target blank) ──
     Mirrors the countdown section in event-page.njk. The preview shows the
     remaining time computed at render (it does not tick every second —
     the live page does).                                                  */
  function CountdownSection(props, data) {
    if (!data.countdown_target) return null;
    var target = new Date(data.countdown_target).getTime();
    var diff = isNaN(target) ? 0 : Math.max(0, target - Date.now());
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    var vals = [
      ['' + Math.floor(diff / 86400000), 'Days'],
      [pad(Math.floor(diff / 3600000) % 24), 'Hours'],
      [pad(Math.floor(diff / 60000) % 60), 'Minutes'],
      [pad(Math.floor(diff / 1000) % 60), 'Seconds']
    ];
    return h('section', { style: { background: '#0A0A0A', padding: '80px 24px', textAlign: 'center' } },
      h('div', { style: { maxWidth: '900px', margin: '0 auto' } },
        data.countdown_heading && h('h2', {
          style: {
            fontFamily: DISPLAY,
            fontSize: 'clamp(28px, 4vw, 40px)',
            textTransform: 'uppercase',
            color: '#fff',
            letterSpacing: '-0.01em',
            marginBottom: '48px'
          }
        }, data.countdown_heading),
        h('div', {
          style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', maxWidth: '720px', margin: '0 auto' }
        },
          vals.map(function (v, i) {
            return h('div', { key: i },
              h('div', {
                style: { fontFamily: DISPLAY, fontSize: 'clamp(36px, 6vw, 60px)', lineHeight: '1', color: ORANGE }
              }, v[0]),
              h('div', {
                style: { fontFamily: BODY, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.15em', marginTop: '12px' }
              }, v[1])
            );
          })
        ),
        h('p', {
          style: { fontFamily: BODY, color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '32px', textTransform: 'uppercase', letterSpacing: '0.08em' }
        }, 'Counts down live on the published page')
      )
    );
  }

  /* ── Event Schedule (optional: hidden when no schedule items) ── */
  function ScheduleSection(props, schedule) {
    if (!schedule || !schedule.items || !schedule.items.length) return null;
    return h('section', { style: { background: '#F5F5F5', padding: '96px 24px' } },
      h('div', { style: { maxWidth: '1100px', margin: '0 auto' } },
        h('div', { style: { textAlign: 'center', marginBottom: '56px' } },
          Badge(schedule.badge),
          schedule.heading && h('h2', {
            style: {
              fontFamily: DISPLAY,
              fontSize: 'clamp(32px, 5vw, 48px)',
              textTransform: 'uppercase',
              color: NAVY,
              letterSpacing: '-0.01em',
              margin: 0
            }
          }, schedule.heading)
        ),
        h('div', {
          style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '20px' }
        },
          schedule.items.map(function (item, i) {
            return h('div', {
              key: i,
              style: {
                background: '#fff',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column'
              }
            },
              h('p', {
                style: { fontFamily: BODY, fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.15em', color: ORANGE, marginBottom: '12px' }
              }, item.day),
              h('h3', {
                style: { fontFamily: DISPLAY, fontSize: '22px', textTransform: 'uppercase', color: NAVY, lineHeight: '1.2', marginBottom: '16px' }
              }, item.label),
              h('p', {
                style: { fontFamily: BODY, color: '#4b5563', fontSize: '15px', marginTop: 'auto' }
              }, item.time)
            );
          })
        )
      )
    );
  }

  /* ── Guest Speaker Spotlight (optional: hidden when full_name blank) ── */
  function SpeakerSection(props, speaker, hostName) {
    if (!speaker || !speaker.full_name) return null;
    var photoSrc = speaker.photo ? resolveImage(props, speaker.photo) : '';
    var textBlock = h('div', { style: photoSrc ? {} : { textAlign: 'center', maxWidth: '640px', margin: '0 auto' } },
      h('h2', {
        style: {
          fontFamily: DISPLAY,
          fontSize: 'clamp(28px, 4vw, 40px)',
          textTransform: 'uppercase',
          color: NAVY,
          letterSpacing: '-0.01em',
          marginBottom: '10px'
        }
      }, speaker.full_name),
      speaker.title && h('p', {
        style: { fontFamily: BODY, fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: ORANGE, marginBottom: '24px' }
      }, speaker.title),
      speaker.bio && h('p', {
        style: { fontFamily: BODY, fontSize: '17px', color: '#4b5563', lineHeight: '1.8' }
      }, speaker.bio),
      hostName && h('p', {
        style: { fontFamily: BODY, fontSize: '13px', color: '#6b7280', marginTop: '32px' }
      }, 'Hosted by ', h('span', { style: { fontWeight: '700', color: NAVY } }, hostName))
    );
    return h('section', { style: { background: '#fff', padding: '96px 24px' } },
      h('div', { style: { maxWidth: '1000px', margin: '0 auto' } },
        h('div', { style: { textAlign: 'center', marginBottom: '56px' } }, Badge('GUEST MINISTER')),
        photoSrc
          ? h('div', {
              style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'center' }
            },
              h('img', {
                src: photoSrc,
                alt: speaker.photo_alt || speaker.full_name,
                style: { width: '100%', borderRadius: '16px', objectFit: 'cover', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }
              }),
              textBlock
            )
          : textBlock
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
          logistics.middle_label
            ? h('div', { style: col },
                h('div', { style: iconStyle }, logistics.middle_icon || '🗓️'),
                h('h3', { style: labelStyle }, logistics.middle_label),
                h('p', { style: valueStyle }, logistics.middle_line1 || '', logistics.middle_line2 ? h('br') : null, logistics.middle_line2 || '')
              )
            : h('div', { style: col },
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
      var schedule     = data.schedule    || {};
      var speaker      = data.speaker     || {};
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
        CountdownSection(props, data),
        TestimonialsSection(props, testimonials),
        WelcomeSection(props, welcome),
        ScheduleSection(props, schedule),
        SpeakerSection(props, speaker, data.host_name),
        FeaturesSection(props, features),
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

  /* ══════════════════════════════════════════════════════════════════
     Blog Posts Preview Component
     Registered for the 'posts' folder collection.
     Body rendered via props.widgetFor('body') — Decap's own markdown
     renderer; no custom markdown parsing needed.
     ══════════════════════════════════════════════════════════════════ */
  function BlogPostPreview(props) {
    injectTailwind();

    try {
      var entry   = props.entry;
      var rawData = entry.get('data');
      if (!rawData) return h('div', { style: { padding: '40px', fontFamily: BODY, color: '#888' } }, 'Loading preview…');

      var data        = rawData.toJS ? rawData.toJS() : {};
      var title       = data.title    || '';
      var category    = data.category || '';
      var author      = data.author   || '';
      var readTime    = data.read_time;
      var heroImage   = resolveImage(props, data.hero_image);
      var scriptureRefs = data.scripture_references || [];

      var dateStr = '';
      if (data.date) {
        try {
          dateStr = new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) { dateStr = String(data.date); }
      }

      var catLabel = category ? (category.charAt(0).toUpperCase() + category.slice(1)) : '';

      /* Article body styles — mirrors post.njk <style> block */
      var articleBodyStyle = [
        'article h2 { font-family: Anton, sans-serif; font-size: clamp(1.4rem,3vw,1.875rem); text-transform: uppercase; color: #111827; letter-spacing: -0.025em; margin-top: 2.5rem; margin-bottom: 1rem; line-height: 1.2; }',
        'article p { color: #4B5563; font-size: 1.125rem; line-height: 1.75rem; margin-bottom: 1.5rem; }',
        'article a { color: #D95A2B; text-decoration: none; }',
        'article a:hover { text-decoration: underline; }',
        'article ul, article ol { color: #4B5563; font-size: 1.125rem; line-height: 1.75rem; margin-bottom: 1.5rem; padding-left: 1.5rem; }',
        'article ul { list-style-type: disc; }',
        'article ol { list-style-type: decimal; }',
        'article li { margin-bottom: 0.5rem; }',
        'article blockquote { border-left: 4px solid #D95A2B; padding: 1rem 1.5rem; margin: 1.5rem 0; background: #FFF8F5; color: #374151; font-style: italic; font-size: 1.125rem; line-height: 1.75rem; }',
        'article strong { color: #111827; font-weight: 700; }'
      ].join('\n');

      return h('div', { style: { fontFamily: BODY, background: '#fff', margin: 0, padding: 0 } },

        /* Inject article body styles once */
        h('style', null, articleBodyStyle),

        /* Preview notice bar */
        h('div', {
          style: {
            background: '#111', color: '#666', fontSize: '11px',
            fontFamily: BODY, padding: '7px 16px',
            textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase'
          }
        }, 'Preview — nav, footer, and modal not shown'),

        /* Hero */
        h('section', {
          style: { position: 'relative', overflow: 'hidden', height: '60vh', minHeight: '360px' }
        },
          h('img', {
            src: heroImage, alt: '',
            style: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }
          }),
          h('div', {
            style: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.60), rgba(0,0,0,0.50), rgba(0,0,0,0.80))' }
          }),
          h('div', {
            style: {
              position: 'relative', zIndex: 10, height: '100%',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              paddingBottom: '48px', padding: '0 24px 48px'
            }
          },
            h('div', { style: { maxWidth: '768px', textAlign: 'center' } },
              catLabel && h('span', {
                style: {
                  display: 'inline-block', background: ORANGE, color: '#fff',
                  padding: '4px 16px', borderRadius: '999px', fontSize: '11px',
                  fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px'
                }
              }, catLabel),
              h('h1', {
                style: {
                  fontFamily: DISPLAY,
                  fontSize: 'clamp(32px, 6vw, 56px)',
                  textTransform: 'uppercase', color: '#fff',
                  lineHeight: '1', letterSpacing: '-0.01em', margin: 0
                }
              }, title)
            )
          )
        ),

        /* Meta bar */
        h('section', { style: { background: '#fff', padding: '40px 24px 16px' } },
          h('div', {
            style: {
              maxWidth: '768px', margin: '0 auto',
              display: 'flex', flexWrap: 'wrap', gap: '24px',
              alignItems: 'center', color: '#6b7280', fontSize: '14px',
              borderBottom: '1px solid #f3f4f6', paddingBottom: '32px'
            }
          },
            dateStr  && h('span', null, '📅 ' + dateStr),
            author   && h('span', null, '👤 ' + author),
            readTime && h('span', null, '⏱ ' + readTime + ' min read')
          )
        ),

        /* Article body — Decap renders markdown natively via widgetFor */
        h('article', { style: { background: '#fff', padding: '40px 24px' } },
          h('div', { style: { maxWidth: '768px', margin: '0 auto' } },
            props.widgetFor('body'),

            /* Scripture references */
            scriptureRefs.length > 0 && h('div', {
              style: {
                marginTop: '48px', background: '#f9fafb',
                borderLeft: '4px solid #D95A2B', borderRadius: '0 8px 8px 0', padding: '32px'
              }
            },
              h('h3', {
                style: {
                  fontFamily: DISPLAY, fontSize: '18px', textTransform: 'uppercase',
                  color: '#111827', letterSpacing: '-0.01em', marginBottom: '16px', marginTop: 0
                }
              }, 'Read Further'),
              h('ul', { style: { listStyle: 'none', padding: 0, margin: 0 } },
                scriptureRefs.map(function (ref, i) {
                  return h('li', {
                    key: i,
                    style: { display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }
                  },
                    h('span', { style: { color: ORANGE, fontWeight: '700', flexShrink: 0 } }, '●'),
                    h('span', { style: { color: '#4b5563', fontSize: '18px', lineHeight: '1.75' } }, ref)
                  );
                })
              )
            )
          )
        )
      );
    } catch (err) {
      return h('div', {
        style: { padding: '32px', fontFamily: 'monospace', fontSize: '13px', color: '#c00', background: '#fff1f1' }
      }, 'Preview error: ' + err.message);
    }
  }

  window.CMS.registerPreviewTemplate('posts', BlogPostPreview);

  /* ══════════════════════════════════════════════════════════════════
     Shared helpers for Main Pages and Ministries previews
     ══════════════════════════════════════════════════════════════════ */

  function getData(props) {
    var raw = props.entry.get('data');
    return (raw && raw.toJS) ? raw.toJS() : {};
  }

  function noticeBar() {
    return h('div', {
      style: {
        background: '#111', color: '#666', fontSize: '11px', fontFamily: BODY,
        padding: '7px 16px', textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase'
      }
    }, 'Preview — nav, footer, and modal not shown');
  }

  /* Standard page hero: image bg + dark overlay + centered children */
  function pageHero(imgSrc, height, children) {
    return h('section', {
      style: { position: 'relative', overflow: 'hidden', height: height || '65vh', minHeight: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
    },
      imgSrc && h('img', {
        src: imgSrc, alt: '',
        style: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }
      }),
      h('div', { style: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.45), rgba(0,0,0,0.75))' } }),
      h('div', { style: { position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: '900px', margin: '0 auto', width: '100%' } },
        children
      )
    );
  }

  /* Section wrapper with max-width container */
  function wrap(bg, py, children) {
    return h('section', { style: { background: bg || '#fff', padding: py || '80px 24px' } },
      h('div', { style: { maxWidth: '960px', margin: '0 auto' } }, children)
    );
  }

  /* Headline with red second line — shared by home + about hero */
  function splitHeadline(line1, line2, size) {
    return h('h1', {
      style: {
        fontFamily: DISPLAY, fontSize: size || 'clamp(40px, 8vw, 80px)',
        textTransform: 'uppercase', color: '#fff', lineHeight: '1.1',
        letterSpacing: '-0.01em', margin: '0 0 24px'
      }
    }, line1, h('br'), h('span', { style: { color: '#D95A2B' } }, line2 || ''));
  }

  /* Orange pill badge */
  function pill(text) {
    if (!text) return null;
    return h('span', {
      style: {
        display: 'inline-block', background: ORANGE, color: '#fff', padding: '8px 24px',
        borderRadius: '999px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
        letterSpacing: '0.1em', marginBottom: '24px', fontFamily: BODY
      }
    }, text);
  }

  /* CTA button (outline white) */
  function ctaBtn(label, solid) {
    return h('span', {
      style: {
        display: 'inline-block',
        background: solid ? ORANGE : 'transparent',
        border: solid ? 'none' : '2px solid #fff',
        color: '#fff',
        padding: '14px 40px', borderRadius: '999px', fontFamily: BODY,
        fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em'
      }
    }, label);
  }

  /* Anton h2 heading */
  function h2Anton(text, color) {
    return h('h2', {
      style: {
        fontFamily: DISPLAY, fontSize: 'clamp(28px, 4vw, 44px)',
        textTransform: 'uppercase', color: color || NAVY,
        letterSpacing: '-0.01em', margin: '0 0 24px', lineHeight: '1.1'
      }
    }, text);
  }

  /* Body paragraph */
  function para(text, style) {
    return h('p', {
      style: Object.assign({ fontFamily: BODY, fontSize: '17px', color: '#4b5563', lineHeight: '1.8', marginBottom: '16px' }, style || {})
    }, text || '');
  }

  /* ══════════════════════════════════════════════════════════════════
     Homepage Preview  (file entry name: 'home')
     ══════════════════════════════════════════════════════════════════ */
  function HomePreview(props) {
    injectTailwind();
    try {
      var data       = getData(props);
      var hero       = data.hero        || {};
      var about      = data.about       || {};
      var leadership = data.leadership  || {};
      var mins       = data.ministries  || [];

      return h('div', { style: { fontFamily: BODY, background: '#fff', margin: 0, padding: 0 } },
        noticeBar(),

        /* Hero */
        pageHero(resolveImage(props, hero.image), '100vh',
          h('div', null,
            splitHeadline(hero.headline || '', hero.headline_highlight || '', 'clamp(48px,10vw,96px)'),
            h('p', { style: { fontFamily: BODY, color: 'rgba(255,255,255,0.9)', fontSize: '20px', fontWeight: '300', maxWidth: '700px', margin: '0 auto 40px', lineHeight: '1.6' } }, hero.tagline || ''),
            h('div', { style: { display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' } },
              ctaBtn('Plan Your Visit', true), ctaBtn('Watch Online', false)
            )
          )
        ),

        /* About */
        h('section', { style: { background: '#fff', padding: '96px 24px 48px' } },
          h('div', { style: { maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' } },
            h('div', { style: { background: '#f3f4f6', borderRadius: '8px', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '13px', fontFamily: BODY } }, 'Congregation photo (static)'),
            h('div', null,
              pill('Who We Are'),
              h2Anton('WE ARE ', NAVY),
              h('h2', { style: { fontFamily: DISPLAY, fontSize: 'clamp(28px,4vw,44px)', textTransform: 'uppercase', color: ORANGE, letterSpacing: '-0.01em', margin: '-16px 0 24px', lineHeight: '1.1' } }, 'PACESETTERS'),
              para(about.body1), para(about.body2)
            )
          )
        ),

        /* Blog placeholder */
        wrap('#fff', '16px 24px 80px',
          h('div', { style: { textAlign: 'center' } },
            h('p', { style: { fontFamily: BODY, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.12em', color: ORANGE, marginBottom: '12px' } }, 'From the Blog'),
            h2Anton('Latest Insights and Updates', NAVY),
            h('div', { style: { background: '#f9fafb', borderRadius: '12px', padding: '28px', color: '#9ca3af', fontFamily: BODY, fontSize: '13px', marginTop: '16px' } }, '✦  Blog cards auto-generated from the two most recent posts — visible on the live site  ✦')
          )
        ),

        /* Mission */
        h('section', { style: { background: '#0A0A0A', padding: '96px 24px', textAlign: 'center' } },
          h('div', { style: { maxWidth: '900px', margin: '0 auto' } },
            h('p', { style: { fontFamily: BODY, color: '#9ca3af', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '32px' } }, 'Our Mission'),
            h('h2', { style: { fontFamily: DISPLAY, fontSize: 'clamp(36px,7vw,72px)', textTransform: 'uppercase', color: '#fff', lineHeight: '1.2', marginBottom: '40px' } },
              'RAISING CHRIST-LIKE PACESETTERS', h('br'),
              'WHO ', h('span', { style: { color: '#D95A2B' } }, 'MAXIMIZE THEIR POTENTIAL'), h('br'),
              'AND ENJOY LIFE'
            ),
            h('p', { style: { fontFamily: BODY, color: '#d1d5db', fontSize: '17px', lineHeight: '1.8' } }, data.mission_body || '')
          )
        ),

        /* Leadership */
        h('section', { style: { background: '#0A0A0A', padding: '80px 24px' } },
          h('div', { style: { maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' } },
            h('img', { src: '/assets/images/2026/leadership/PJ-and-PA.jpeg', alt: 'Lead Pastors', style: { width: '100%', height: '420px', objectFit: 'cover', borderRadius: '8px' } }),
            h('div', { style: { color: '#fff' } },
              pill('Our Leadership'),
              h('h2', { style: { fontFamily: DISPLAY, fontSize: '36px', textTransform: 'uppercase', lineHeight: '1.1', margin: '0 0 20px' } },
                'MEET OUR', h('br'), h('span', { style: { color: '#D95A2B' } }, 'LEAD PASTORS')
              ),
              h('h3', { style: { fontFamily: BODY, fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#fff' } }, 'Pastor John & Pastor Rosemary Itakpe'),
              h('p', { style: { fontFamily: BODY, color: '#d1d5db', fontSize: '16px', lineHeight: '1.8', marginBottom: '20px' } }, leadership.bio || ''),
              leadership.blockquote && h('div', { style: { background: 'rgba(255,255,255,0.08)', borderLeft: '4px solid #D95A2B', padding: '20px 24px', borderRadius: '0 8px 8px 0' } },
                h('p', { style: { fontFamily: BODY, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', fontSize: '16px' } }, '“' + leadership.blockquote + '”')
              )
            )
          )
        ),

        /* Ministry cards */
        mins.length > 0 && h('section', { style: { background: '#f5f5f5', padding: '80px 24px' } },
          h('div', { style: { maxWidth: '960px', margin: '0 auto' } },
            h('div', { style: { textAlign: 'center', marginBottom: '48px' } },
              h2Anton('Get Involved', NAVY)
            ),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' } },
              mins.map(function (m, i) {
                return h('div', { key: i, style: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' } },
                  h('div', { style: { height: '160px', overflow: 'hidden' } },
                    h('img', { src: resolveImage(props, m.image), alt: m.title || '', style: { width: '100%', height: '100%', objectFit: 'cover' } })
                  ),
                  h('div', { style: { padding: '20px' } },
                    h('h3', { style: { fontFamily: DISPLAY, fontSize: '16px', textTransform: 'uppercase', color: NAVY, marginBottom: '4px' } }, m.title || ''),
                    h('p', { style: { fontFamily: BODY, fontSize: '11px', color: ORANGE, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' } }, m.subtitle || ''),
                    h('p', { style: { fontFamily: BODY, fontSize: '13px', color: '#4b5563', lineHeight: '1.6' } }, m.body || '')
                  )
                );
              })
            )
          )
        ),

        /* CTA */
        data.cta_body && h('section', { style: { background: ORANGE, padding: '80px 24px', textAlign: 'center' } },
          h('div', { style: { maxWidth: '700px', margin: '0 auto' } },
            h('p', { style: { fontFamily: BODY, color: '#fff', fontSize: '20px', lineHeight: '1.8', marginBottom: '36px' } }, data.cta_body),
            h('span', { style: { display: 'inline-block', background: '#fff', color: ORANGE, padding: '16px 48px', borderRadius: '999px', fontFamily: BODY, fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Join Us This Sunday')
          )
        )
      );
    } catch (err) {
      return h('div', { style: { padding: '32px', fontFamily: 'monospace', fontSize: '13px', color: '#c00', background: '#fff1f1' } }, 'Preview error: ' + err.message);
    }
  }
  window.CMS.registerPreviewTemplate('home', HomePreview);

  /* ══════════════════════════════════════════════════════════════════
     About Us Preview  (file entry name: 'about')
     ══════════════════════════════════════════════════════════════════ */
  function AboutPreview(props) {
    injectTailwind();
    try {
      var data     = getData(props);
      var hero     = data.hero    || {};
      var pastor   = data.pastor  || {};
      var tests    = data.testimonials || [];

      return h('div', { style: { fontFamily: BODY, background: '#fff', margin: 0, padding: 0 } },
        noticeBar(),

        /* Hero */
        pageHero(resolveImage(props, hero.image), '65vh',
          splitHeadline(hero.headline || '', hero.headline_highlight || '')
        ),

        /* We Serve God */
        wrap('#fff', '80px 24px',
          h('div', null,
            h2Anton('WE SERVE GOD ', NAVY),
            h('h2', { style: { fontFamily: DISPLAY, fontSize: 'clamp(28px,4vw,44px)', textTransform: 'uppercase', color: ORANGE, letterSpacing: '-0.01em', margin: '-16px 0 28px', lineHeight: '1.1' } }, 'BY HIS SPIRIT'),
            para(data.serve_body1), para(data.serve_body2)
          )
        ),

        /* Approach pillars — static */
        wrap('#fff', '0 24px 64px',
          h('div', { style: { textAlign: 'center' } },
            h2Anton('Our Approach', NAVY),
            h('div', { style: { width: '64px', height: '4px', background: ORANGE, margin: '0 auto 40px' } }),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '24px' } },
              ['Word', 'Worship', 'Community', 'Impact'].map(function (name, i) {
                return h('div', { key: i, style: { textAlign: 'center' } },
                  h('div', { style: { width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' } },
                    ['📖','🎵','🤝','🌍'][i]
                  ),
                  h('h3', { style: { fontFamily: BODY, fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, name)
                );
              })
            )
          )
        ),

        /* Pastor */
        wrap('#f5f5f5', '80px 24px',
          h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' } },
            h('img', { src: resolveImage(props, pastor.photo) || '/assets/images/2026/leadership/PJ-and-PA.jpeg', alt: 'Lead Pastors', style: { width: '100%', height: '400px', objectFit: 'cover', borderRadius: '8px' } }),
            h('div', null,
              pill('Our Lead Pastors'),
              h2Anton('Pastor John & Pastor Rosemary Itakpe', NAVY),
              para(pastor.bio1), para(pastor.bio2), para(pastor.bio3)
            )
          )
        ),

        /* Vision */
        wrap('#0A0A0A', '80px 24px',
          h('div', { style: { maxWidth: '760px', margin: '0 auto', textAlign: 'center' } },
            pill('Our Vision'),
            h2Anton('A Vision for Every Life', '#fff'),
            h('p', { style: { fontFamily: BODY, fontSize: '17px', color: '#d1d5db', lineHeight: '1.8', marginBottom: '16px' } }, data.vision_body1 || ''),
            h('p', { style: { fontFamily: BODY, fontSize: '17px', color: '#d1d5db', lineHeight: '1.8' } }, data.vision_body2 || '')
          )
        ),

        /* Testimonials */
        tests.length > 0 && wrap('#fff', '80px 24px',
          h('div', null,
            h('div', { style: { textAlign: 'center', marginBottom: '48px' } },
              pill('What People Say'),
              h2Anton('Voices of Transformation', NAVY)
            ),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '24px' } },
              tests.map(function (t, i) {
                return h('div', { key: i, style: { background: '#f9fafb', borderRadius: '16px', padding: '32px' } },
                  h('p', { style: { fontFamily: BODY, fontSize: '36px', fontWeight: '900', color: ORANGE, lineHeight: '1', marginBottom: '12px' } }, '“'),
                  h('p', { style: { fontFamily: BODY, fontSize: '15px', color: '#374151', lineHeight: '1.7', fontStyle: 'italic', marginBottom: '20px' } }, t.quote || ''),
                  h('p', { style: { fontFamily: BODY, fontWeight: '700', fontSize: '13px', color: ORANGE } }, '— ' + (t.attribution || ''))
                );
              })
            )
          )
        )
      );
    } catch (err) {
      return h('div', { style: { padding: '32px', fontFamily: 'monospace', fontSize: '13px', color: '#c00', background: '#fff1f1' } }, 'Preview error: ' + err.message);
    }
  }
  window.CMS.registerPreviewTemplate('about', AboutPreview);

  /* ══════════════════════════════════════════════════════════════════
     Contact Preview  (file entry name: 'contact')
     Hero image is the only CMS-managed field; all contact info is
     static (from site.*). Preview shows the full page layout.
     ══════════════════════════════════════════════════════════════════ */
  function ContactPreview(props) {
    injectTailwind();
    try {
      var data = getData(props);
      var hero = data.hero || {};

      var infoRow = function (icon, label, value) {
        return h('div', { style: { display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' } },
          h('div', { style: { width: '40px', height: '40px', background: '#FFF0EA', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' } }, icon),
          h('div', null,
            h('p', { style: { fontFamily: BODY, fontWeight: '600', marginBottom: '2px' } }, label),
            h('p', { style: { fontFamily: BODY, color: '#4b5563', fontSize: '15px', lineHeight: '1.6' } }, value)
          )
        );
      };

      return h('div', { style: { fontFamily: BODY, background: '#fff', margin: 0, padding: 0 } },
        noticeBar(),

        pageHero(resolveImage(props, hero.image), '60vh',
          h('div', null,
            h('h1', { style: { fontFamily: DISPLAY, fontSize: 'clamp(40px,8vw,72px)', textTransform: 'uppercase', color: '#fff', lineHeight: '1', letterSpacing: '-0.01em', margin: 0 } }, 'Contact Us')
          )
        ),

        /* Contact + form */
        h('section', { style: { background: '#f5f5f5', padding: '80px 24px' } },
          h('div', { style: { maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' } },

            /* Form */
            h('div', { style: { background: '#fff', borderRadius: '16px', padding: '40px' } },
              h2Anton('Send Us a Message', NAVY),
              ['Full Name', 'Email', 'Phone'].map(function (label, i) {
                return h('div', { key: i, style: { marginBottom: '16px' } },
                  h('label', { style: { fontFamily: BODY, fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' } }, label),
                  h('div', { style: { border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 16px', background: '#f9fafb', color: '#9ca3af', fontSize: '14px', fontFamily: BODY } }, 'Enter ' + label.toLowerCase() + '…')
                );
              }),
              h('div', { style: { marginBottom: '20px' } },
                h('label', { style: { fontFamily: BODY, fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' } }, 'Message'),
                h('div', { style: { border: '1px solid #d1d5db', borderRadius: '8px', padding: '12px 16px', background: '#f9fafb', color: '#9ca3af', fontSize: '14px', fontFamily: BODY, height: '100px' } }, 'How can we help you?')
              ),
              h('div', { style: { background: ORANGE, color: '#fff', padding: '14px', borderRadius: '999px', textAlign: 'center', fontFamily: BODY, fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Send Message')
            ),

            /* Contact details */
            h('div', null,
              h('div', { style: { background: '#fff', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' } },
                h('h3', { style: { fontFamily: DISPLAY, fontSize: '22px', textTransform: 'uppercase', color: NAVY, marginBottom: '24px' } }, 'Location'),
                infoRow('📍', 'Address', '529 Walker Avenue\nBaltimore, MD 21212'),
                infoRow('📞', 'Phone', '+1 (410) 900-9111'),
                infoRow('✉️', 'Email', 'info@mercycourt.org')
              ),
              h('div', { style: { background: '#0A0A0A', borderRadius: '16px', padding: '32px', color: '#fff' } },
                h('h3', { style: { fontFamily: DISPLAY, fontSize: '22px', textTransform: 'uppercase', marginBottom: '24px' } }, 'Service Times'),
                [['Sunday Service', '10:00 AM'], ['Wednesday Bible Study', '7:00 PM'], ['Friday Prayer Meeting', '7:00 PM']].map(function (row, i) {
                  return h('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < 2 ? '1px solid #374151' : 'none', paddingBottom: i < 2 ? '12px' : 0, marginBottom: i < 2 ? '12px' : 0 } },
                    h('span', { style: { fontFamily: BODY, fontWeight: '600', fontSize: '14px' } }, row[0]),
                    h('span', { style: { fontFamily: BODY, fontWeight: '700', color: '#D95A2B', fontSize: '14px' } }, row[1])
                  );
                })
              )
            )
          )
        )
      );
    } catch (err) {
      return h('div', { style: { padding: '32px', fontFamily: 'monospace', fontSize: '13px', color: '#c00', background: '#fff1f1' } }, 'Preview error: ' + err.message);
    }
  }
  window.CMS.registerPreviewTemplate('contact', ContactPreview);

  /* ══════════════════════════════════════════════════════════════════
     Plan Your Visit Preview  (file entry name: 'plan-your-visit')
     ══════════════════════════════════════════════════════════════════ */
  function PlanYourVisitPreview(props) {
    injectTailwind();
    try {
      var data = getData(props);
      var hero = data.hero || {};
      var faq  = data.faq  || [];

      return h('div', { style: { fontFamily: BODY, background: '#fff', margin: 0, padding: 0 } },
        noticeBar(),

        pageHero(resolveImage(props, hero.image), '65vh',
          h('div', null,
            h('h1', { style: { fontFamily: DISPLAY, fontSize: 'clamp(40px,8vw,72px)', textTransform: 'uppercase', color: '#fff', lineHeight: '1', letterSpacing: '-0.01em', margin: 0 } }, 'Plan Your Visit')
          )
        ),

        /* Welcome */
        wrap('#fff', '80px 24px',
          h('div', { style: { maxWidth: '760px', margin: '0 auto', textAlign: 'center' } },
            pill('We’ve Been Expecting You'),
            h2Anton('A Warm Welcome Awaits', NAVY),
            para(data.welcome_body1), para(data.welcome_body2), para(data.welcome_body3)
          )
        ),

        /* Video */
        wrap('#f5f5f5', '64px 24px',
          h('div', { style: { maxWidth: '760px', margin: '0 auto' } },
            h('div', { style: { borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9', background: '#0F1E35' } },
              data.video_url
                ? h('iframe', { src: data.video_url, frameBorder: '0', allowFullScreen: true, style: { width: '100%', height: '100%', display: 'block', minHeight: '320px' } })
                : h('div', { style: { width: '100%', minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' } },
                    h('div', { style: { width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
                      h('svg', { style: { width: '36px', height: '36px', color: '#fff', marginLeft: '4px' }, fill: 'currentColor', viewBox: '0 0 24 24' },
                        h('path', { d: 'M8 5v14l11-7z' })
                      )
                    ),
                    h('p', { style: { fontFamily: BODY, color: 'rgba(255,255,255,0.5)', fontSize: '13px' } }, 'Add a video URL in the Video field to embed here')
                  )
            )
          )
        ),

        /* FAQ */
        faq.length > 0 && wrap('#fff', '64px 24px',
          h('div', null,
            h('div', { style: { textAlign: 'center', marginBottom: '48px' } },
              pill('Questions & Answers'),
              h2Anton('We’ve Got Answers', NAVY)
            ),
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' } },
              faq.map(function (item, i) {
                return h('div', { key: i, style: { background: '#f9fafb', borderRadius: '12px', padding: '24px' } },
                  h('p', { style: { fontFamily: BODY, fontWeight: '700', fontSize: '15px', color: NAVY, marginBottom: '10px' } }, item.question || ''),
                  h('p', { style: { fontFamily: BODY, fontSize: '14px', color: '#4b5563', lineHeight: '1.7' } }, item.answer || '')
                );
              })
            )
          )
        )
      );
    } catch (err) {
      return h('div', { style: { padding: '32px', fontFamily: 'monospace', fontSize: '13px', color: '#c00', background: '#fff1f1' } }, 'Preview error: ' + err.message);
    }
  }
  window.CMS.registerPreviewTemplate('plan-your-visit', PlanYourVisitPreview);

  /* ══════════════════════════════════════════════════════════════════
     Community Impact Preview  (file entry name: 'community-impact')
     ══════════════════════════════════════════════════════════════════ */
  function CommunityImpactPreview(props) {
    injectTailwind();
    try {
      var data     = getData(props);
      var hero     = data.hero     || {};
      var mission  = data.mission  || {};
      var stats    = data.stats    || [];
      var programs = data.programs || [];
      var partners = data.partners || [];
      var tests    = data.testimonials     || [];
      var pantry   = data.pantry_highlight || {};
      var goals    = data.goals            || [];

      return h('div', { style: { fontFamily: BODY, background: '#fff', margin: 0, padding: 0 } },
        noticeBar(),

        /* Hero with subtitle */
        pageHero(resolveImage(props, hero.image), '65vh',
          h('div', null,
            h('h1', { style: { fontFamily: DISPLAY, fontSize: 'clamp(40px,7vw,64px)', textTransform: 'uppercase', color: '#fff', lineHeight: '1', letterSpacing: '-0.01em', margin: '0 0 20px' } }, 'Community Impact'),
            hero.subtitle && h('p', { style: { fontFamily: BODY, color: 'rgba(255,255,255,0.9)', fontSize: '18px', lineHeight: '1.7', maxWidth: '600px', margin: '0 auto' } }, hero.subtitle)
          )
        ),

        /* Mission */
        wrap('#fff', '80px 24px',
          h('div', { style: { maxWidth: '760px', margin: '0 auto' } },
            pill('Our Mission'),
            h2Anton('We Exist to Serve, Empower, and Transform', NAVY),
            para(mission.body1), para(mission.body2), para(mission.body3)
          )
        ),

        /* Stats */
        stats.length > 0 && h('section', { style: { background: ORANGE, padding: '64px 24px' } },
          h('div', { style: { maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(' + Math.min(stats.length, 4) + ',1fr)', gap: '24px', textAlign: 'center' } },
            stats.map(function (s, i) {
              return h('div', { key: i },
                h('p', { style: { fontFamily: DISPLAY, fontSize: 'clamp(40px,6vw,64px)', color: '#fff', lineHeight: '1', marginBottom: '8px' } }, s.number || ''),
                h('p', { style: { fontFamily: BODY, color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' } }, s.label || '')
              );
            })
          )
        ),

        /* Pantry hours banner */
        data.pantry_hours && h('section', { style: { background: NAVY, padding: '20px 24px', textAlign: 'center' } },
          h('p', { style: { fontFamily: BODY, color: '#fff', fontSize: '14px', fontWeight: '600' } }, '🗓 Food Pantry: ' + data.pantry_hours)
        ),

        /* Programs */
        programs.length > 0 && wrap('#f5f5f5', '72px 24px',
          h('div', null,
            h('div', { style: { textAlign: 'center', marginBottom: '40px' } },
              pill('What We Do'),
              h2Anton('Our Programs', NAVY)
            ),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' } },
              programs.map(function (p, i) {
                return h('div', { key: i, style: { background: '#fff', borderRadius: '12px', padding: '28px' } },
                  h('div', { style: { fontSize: '40px', marginBottom: '16px' } }, p.emoji || ''),
                  h('h3', { style: { fontFamily: DISPLAY, fontSize: '18px', textTransform: 'uppercase', color: NAVY, marginBottom: '10px' } }, p.title || ''),
                  h('p', { style: { fontFamily: BODY, fontSize: '14px', color: '#4b5563', lineHeight: '1.7' } }, p.body || '')
                );
              })
            )
          )
        ),

        /* Partners */
        partners.length > 0 && wrap('#fff', '72px 24px',
          h('div', null,
            h('div', { style: { textAlign: 'center', marginBottom: '40px' } },
              pill('Who We Work With'),
              h2Anton('Community Partners', NAVY)
            ),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' } },
              partners.map(function (p, i) {
                return h('div', { key: i, style: { background: '#f9fafb', borderRadius: '12px', padding: '24px' } },
                  h('h3', { style: { fontFamily: BODY, fontWeight: '700', fontSize: '15px', color: NAVY, marginBottom: '10px' } }, p.name || ''),
                  h('p', { style: { fontFamily: BODY, fontSize: '14px', color: '#4b5563', lineHeight: '1.7' } }, p.description || '')
                );
              })
            )
          )
        ),

        /* Testimonials */
        tests.length > 0 && wrap(NAVY, '72px 24px',
          h('div', null,
            h('div', { style: { textAlign: 'center', marginBottom: '40px' } },
              pill('Community Voices'),
              h2Anton('What the Community Says', '#fff')
            ),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(' + Math.min(tests.length, 2) + ',1fr)', gap: '20px' } },
              tests.map(function (t, i) {
                return h('div', { key: i, style: { background: '#fff', borderRadius: '16px', padding: '28px' } },
                  h('p', { style: { fontFamily: BODY, fontSize: '32px', fontWeight: '900', color: ORANGE, lineHeight: '1', marginBottom: '10px' } }, '“'),
                  h('p', { style: { fontFamily: BODY, fontSize: '15px', color: '#374151', lineHeight: '1.7', fontStyle: 'italic', marginBottom: '16px' } }, t.quote || ''),
                  h('p', { style: { fontFamily: BODY, fontWeight: '700', fontSize: '12px', color: ORANGE } }, '— ' + (t.attribution || ''))
                );
              })
            )
          )
        ),

        /* Pantry highlight */
        (pantry.body1 || pantry.body2 || pantry.body3) && wrap(ORANGE, '72px 24px',
          h('div', { style: { maxWidth: '760px', margin: '0 auto', textAlign: 'center' } },
            pill('Food Pantry'),
            h2Anton('Open Every Thursday', '#fff'),
            h('p', { style: { fontFamily: BODY, color: '#fff', fontSize: '17px', lineHeight: '1.8', marginBottom: '16px' } }, pantry.body1 || ''),
            h('p', { style: { fontFamily: BODY, color: 'rgba(255,255,255,0.9)', fontSize: '17px', lineHeight: '1.8', marginBottom: '16px' } }, pantry.body2 || ''),
            h('p', { style: { fontFamily: BODY, color: 'rgba(255,255,255,0.9)', fontSize: '17px', lineHeight: '1.8' } }, pantry.body3 || '')
          )
        ),

        /* Goals */
        goals.length > 0 && wrap('#fff', '72px 24px',
          h('div', null,
            h('div', { style: { textAlign: 'center', marginBottom: '40px' } },
              pill('Looking Forward'),
              h2Anton('Our Goals', NAVY)
            ),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' } },
              goals.map(function (g, i) {
                return h('div', { key: i, style: { background: '#f9fafb', borderRadius: '12px', padding: '28px' } },
                  h('div', { style: { fontSize: '40px', marginBottom: '16px' } }, g.emoji || ''),
                  h('h3', { style: { fontFamily: DISPLAY, fontSize: '18px', textTransform: 'uppercase', color: NAVY, marginBottom: '10px' } }, g.title || ''),
                  h('p', { style: { fontFamily: BODY, fontSize: '14px', color: '#4b5563', lineHeight: '1.7' } }, g.body || '')
                );
              })
            )
          )
        ),

        /* Volunteer */
        (data.volunteer_intro1 || data.volunteer_intro2) && wrap(NAVY, '64px 24px',
          h('div', { style: { maxWidth: '760px', margin: '0 auto', textAlign: 'center' } },
            pill('Get Involved'),
            h2Anton('Volunteer With Us', '#fff'),
            h('p', { style: { fontFamily: BODY, color: '#d1d5db', fontSize: '17px', lineHeight: '1.8', marginBottom: '16px' } }, data.volunteer_intro1 || ''),
            h('p', { style: { fontFamily: BODY, color: '#d1d5db', fontSize: '17px', lineHeight: '1.8' } }, data.volunteer_intro2 || '')
          )
        )
      );
    } catch (err) {
      return h('div', { style: { padding: '32px', fontFamily: 'monospace', fontSize: '13px', color: '#c00', background: '#fff1f1' } }, 'Preview error: ' + err.message);
    }
  }
  window.CMS.registerPreviewTemplate('community-impact', CommunityImpactPreview);

  /* ══════════════════════════════════════════════════════════════════
     Ministries Overview Preview  (file entry name: 'ministries')
     ══════════════════════════════════════════════════════════════════ */
  function MinistriesPreview(props) {
    injectTailwind();
    try {
      var data = getData(props);
      var hero = data.hero || {};
      var mins = data.ministries || [];

      return h('div', { style: { fontFamily: BODY, background: '#fff', margin: 0, padding: 0 } },
        noticeBar(),

        /* Hero */
        pageHero(resolveImage(props, hero.image), '65vh',
          h('div', null,
            h('h1', { style: { fontFamily: DISPLAY, fontSize: 'clamp(40px,8vw,80px)', textTransform: 'uppercase', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.01em', margin: '0 0 16px' } }, 'OUR MINISTRIES'),
            hero.subtitle && h('p', { style: { fontFamily: BODY, color: 'rgba(255,255,255,0.8)', fontSize: '18px', lineHeight: '1.7', maxWidth: '560px', margin: '0 auto' } }, hero.subtitle)
          )
        ),

        /* Dark intro */
        h('section', { style: { background: '#0A0A0A', padding: '80px 24px', textAlign: 'center' } },
          h('div', { style: { maxWidth: '760px', margin: '0 auto' } },
            data.intro_eyebrow && h('p', { style: { fontFamily: BODY, color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '12px' } }, data.intro_eyebrow),
            h('h2', { style: { fontFamily: DISPLAY, fontSize: 'clamp(32px,5vw,48px)', textTransform: 'uppercase', color: '#fff', lineHeight: '1.1', marginBottom: '24px' } },
              'AT ', h('span', { style: { color: '#D95A2B' } }, 'MERCY COURT')
            ),
            data.intro_body && h('p', { style: { fontFamily: BODY, color: '#9ca3af', fontSize: '17px', lineHeight: '1.8' } }, data.intro_body)
          )
        ),

        /* Ministry cards */
        mins.length > 0 && h('section', { style: { background: '#fff', padding: '80px 24px' } },
          h('div', { style: { maxWidth: '1040px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '28px' } },
            mins.map(function (m, i) {
              return h('div', { key: i, style: { borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6' } },
                h('div', { style: { position: 'relative', height: '200px', overflow: 'hidden' } },
                  h('img', { src: resolveImage(props, m.image), alt: m.image_alt || m.title || '', style: { width: '100%', height: '100%', objectFit: 'cover' } }),
                  h('div', { style: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' } })
                ),
                h('div', { style: { padding: '20px 24px' } },
                  h('h3', { style: { fontFamily: DISPLAY, fontSize: '20px', textTransform: 'uppercase', color: NAVY, marginBottom: '10px' } }, m.title || ''),
                  h('p', { style: { fontFamily: BODY, fontSize: '13px', color: '#4b5563', lineHeight: '1.7', marginBottom: '14px' } }, m.description || ''),
                  h('span', { style: { fontFamily: BODY, fontWeight: '700', fontSize: '12px', color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Learn More →')
                )
              );
            })
          )
        ),

        /* Get Involved CTA */
        h('section', { style: { background: ORANGE, padding: '80px 24px', textAlign: 'center' } },
          h('div', { style: { maxWidth: '700px', margin: '0 auto' } },
            h('h2', { style: { fontFamily: DISPLAY, fontSize: 'clamp(32px,5vw,48px)', textTransform: 'uppercase', color: '#fff', lineHeight: '1', marginBottom: '20px' } }, 'GET INVOLVED'),
            h('p', { style: { fontFamily: BODY, color: 'rgba(255,255,255,0.9)', fontSize: '17px', lineHeight: '1.8', marginBottom: '32px', maxWidth: '520px', margin: '0 auto 32px' } }, "There's a place for you at Mercy Court. Whether you're a seasoned leader or just beginning your journey, we have a ministry where you can serve and grow."),
            h('div', { style: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' } },
              h('span', { style: { background: '#fff', color: ORANGE, padding: '12px 32px', borderRadius: '999px', fontFamily: BODY, fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Contact Us'),
              h('span', { style: { border: '2px solid #fff', color: '#fff', padding: '12px 32px', borderRadius: '999px', fontFamily: BODY, fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Volunteer')
            )
          )
        )
      );
    } catch (err) {
      return h('div', { style: { padding: '32px', fontFamily: 'monospace', fontSize: '13px', color: '#c00', background: '#fff1f1' } }, 'Preview error: ' + err.message);
    }
  }
  window.CMS.registerPreviewTemplate('ministries', MinistriesPreview);

  /* ══════════════════════════════════════════════════════════════════
     Tehillah Voices Preview  (file entry name: 'tehillah')
     ══════════════════════════════════════════════════════════════════ */
  function TehillahPreview(props) {
    injectTailwind();
    try {
      var data    = getData(props);
      var hero    = data.hero    || {};
      var vision  = data.vision  || {};
      var gallery = data.gallery || [];
      var about   = data.about   || {};

      var g0 = gallery[0] || {};
      var g1 = gallery[1] || {};
      var g2 = gallery[2] || {};

      return h('div', { style: { fontFamily: BODY, background: '#fff', margin: 0, padding: 0 } },
        noticeBar(),

        /* Hero */
        pageHero(resolveImage(props, hero.image), '100vh',
          h('div', null,
            hero.badge && h('p', { style: { fontFamily: BODY, color: '#D95A2B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3em', fontWeight: '700', marginBottom: '16px' } }, hero.badge),
            h('h1', { style: { fontFamily: DISPLAY, fontSize: 'clamp(56px,11vw,108px)', textTransform: 'uppercase', color: '#fff', lineHeight: '1', letterSpacing: '-0.01em', margin: '0 0 20px' } },
              'TEHILLAH', h('br'), h('span', { style: { color: '#D95A2B' } }, 'VOICES')
            ),
            hero.tagline && h('p', { style: { fontFamily: BODY, color: 'rgba(255,255,255,0.8)', fontSize: '18px', lineHeight: '1.7', maxWidth: '520px', margin: '0 auto' } }, hero.tagline)
          )
        ),

        /* Vision */
        h('section', { style: { background: '#0A0A0A', padding: '80px 24px', textAlign: 'center' } },
          h('div', { style: { maxWidth: '760px', margin: '0 auto' } },
            h('p', { style: { fontFamily: BODY, color: '#D95A2B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: '700', marginBottom: '20px' } }, 'Our Heart'),
            vision.heading && h('h2', { style: { fontFamily: DISPLAY, fontSize: 'clamp(28px,4vw,44px)', textTransform: 'uppercase', color: '#fff', lineHeight: '1.1', marginBottom: '28px' } }, vision.heading),
            vision.body && h('p', { style: { fontFamily: BODY, color: '#9ca3af', fontSize: '17px', lineHeight: '1.8' } }, vision.body)
          )
        ),

        /* Gallery + About */
        h('section', { style: { background: '#fff', padding: '80px 24px' } },
          h('div', { style: { maxWidth: '1040px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center' } },

            /* Gallery */
            h('div', null,
              h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' } },
                h('div', { style: { borderRadius: '8px', overflow: 'hidden', height: '220px' } },
                  g0.image ? h('img', { src: resolveImage(props, g0.image), alt: g0.alt || '', style: { width: '100%', height: '100%', objectFit: 'cover' } })
                  : h('div', { style: { width: '100%', height: '100%', background: '#f3f4f6' } })
                ),
                h('div', { style: { borderRadius: '8px', overflow: 'hidden', height: '220px', marginTop: '24px' } },
                  g1.image ? h('img', { src: resolveImage(props, g1.image), alt: g1.alt || '', style: { width: '100%', height: '100%', objectFit: 'cover' } })
                  : h('div', { style: { width: '100%', height: '100%', background: '#f3f4f6' } })
                )
              ),
              h('div', { style: { borderRadius: '8px', overflow: 'hidden', height: '180px' } },
                g2.image ? h('img', { src: resolveImage(props, g2.image), alt: g2.alt || '', style: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' } })
                : h('div', { style: { width: '100%', height: '100%', background: '#f3f4f6' } })
              )
            ),

            /* About */
            h('div', null,
              pill('Who We Are'),
              about.heading && h('h2', { style: { fontFamily: DISPLAY, fontSize: 'clamp(24px,3vw,36px)', textTransform: 'uppercase', color: NAVY, lineHeight: '1.1', marginBottom: '20px' } }, about.heading),
              about.body1 && h('p', { style: { fontFamily: BODY, fontSize: '16px', color: '#4b5563', lineHeight: '1.8', marginBottom: '16px' } }, about.body1),
              about.body2 && h('p', { style: { fontFamily: BODY, fontSize: '16px', color: '#4b5563', lineHeight: '1.8', marginBottom: '24px' } }, about.body2),
              about.instagram_url && h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0A0A0A', color: '#fff', padding: '10px 20px', borderRadius: '999px', fontFamily: BODY, fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, '📸 Follow on Instagram')
            )
          )
        ),

        /* Music / YouTube */
        h('section', { style: { background: '#0A0A0A', padding: '80px 24px', textAlign: 'center' } },
          h('div', { style: { maxWidth: '900px', margin: '0 auto' } },
            h('p', { style: { fontFamily: BODY, color: '#D95A2B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: '700', marginBottom: '12px' } }, 'Listen to'),
            h('h2', { style: { fontFamily: DISPLAY, fontSize: '40px', textTransform: 'uppercase', color: '#fff', marginBottom: '4px' } }, 'OUR MUSIC'),
            h('div', { style: { width: '64px', height: '4px', background: '#D95A2B', margin: '0 auto 40px' } }),
            h('div', { style: { position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', paddingTop: '56.25%', background: '#111', marginBottom: '32px' } },
              data.youtube_url
                ? h('iframe', { src: data.youtube_url, frameBorder: '0', allowFullScreen: true, style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' } })
                : h('div', { style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' } },
                    h('div', { style: { width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
                      h('svg', { fill: 'currentColor', viewBox: '0 0 24 24', style: { width: '28px', height: '28px', color: '#fff', marginLeft: '4px' } }, h('path', { d: 'M8 5v14l11-7z' }))
                    ),
                    h('p', { style: { fontFamily: BODY, color: 'rgba(255,255,255,0.4)', fontSize: '13px' } }, 'Add YouTube URL to embed video')
                  )
            ),
            h('div', { style: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' } },
              h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FF0000', color: '#fff', padding: '10px 24px', borderRadius: '999px', fontFamily: BODY, fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' } }, '▶ Watch on YouTube'),
              h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '8px', border: '2px solid rgba(255,255,255,0.3)', color: '#fff', padding: '10px 24px', borderRadius: '999px', fontFamily: BODY, fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' } }, '📸 Follow on Instagram')
            )
          )
        ),

        /* Join team */
        h('section', { style: { background: '#fff', padding: '80px 24px', textAlign: 'center' } },
          h('div', { style: { maxWidth: '600px', margin: '0 auto' } },
            pill('Get Involved'),
            h('h2', { style: { fontFamily: DISPLAY, fontSize: 'clamp(28px,4vw,44px)', textTransform: 'uppercase', color: NAVY, lineHeight: '1.1', marginBottom: '20px' } },
              'JOIN THE', h('br'), h('span', { style: { color: '#D95A2B' } }, 'WORSHIP TEAM')
            ),
            h('p', { style: { fontFamily: BODY, fontSize: '16px', color: '#4b5563', lineHeight: '1.8', marginBottom: '28px' } }, 'Whether you sing, play an instrument, or serve behind the scenes — there is a place for you in Tehillah Voices.'),
            h('span', { style: { display: 'inline-block', background: ORANGE, color: '#fff', padding: '14px 40px', borderRadius: '999px', fontFamily: BODY, fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Apply to Join')
          )
        ),

        /* Scripture */
        data.scripture_quote && h('section', { style: { background: '#0A0A0A', padding: '56px 24px', textAlign: 'center' } },
          h('div', { style: { maxWidth: '600px', margin: '0 auto' } },
            h('p', { style: { fontFamily: BODY, color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '16px' } }, 'Scripture'),
            h('p', { style: { fontFamily: DISPLAY, fontSize: 'clamp(20px,3vw,28px)', textTransform: 'uppercase', color: '#fff', lineHeight: '1.4', marginBottom: '12px' } }, '"' + data.scripture_quote + '"'),
            data.scripture_ref && h('p', { style: { fontFamily: BODY, fontWeight: '700', color: '#D95A2B', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em' } }, '— ' + data.scripture_ref)
          )
        )
      );
    } catch (err) {
      return h('div', { style: { padding: '32px', fontFamily: 'monospace', fontSize: '13px', color: '#c00', background: '#fff1f1' } }, 'Preview error: ' + err.message);
    }
  }
  window.CMS.registerPreviewTemplate('tehillah', TehillahPreview);

  /* ══════════════════════════════════════════════════════════════════
     Mercy Kidz (God's Heritage) Preview  (file entry name: 'mercy-kidz')
     ══════════════════════════════════════════════════════════════════ */
  function MercyKidzPreview(props) {
    injectTailwind();
    try {
      var data    = getData(props);
      var hero    = data.hero    || {};
      var connect = data.connect || {};
      var faq     = data.faq    || [];

      var sValues = [
        { label: 'Seen',     sub: 'Every child is seen & known',     bg: '#D95A2B', textColor: '#fff'      },
        { label: 'Smiling',  sub: 'Fun is a priority',                bg: '#facc15', textColor: '#713f12'  },
        { label: 'Safe',     sub: 'A secure environment',             bg: '#22c55e', textColor: '#fff'      },
        { label: 'Social',   sub: 'Building lasting friendships',     bg: '#3b82f6', textColor: '#fff'      },
        { label: 'Salvation',sub: 'Leading kids to know Jesus',       bg: '#a855f7', textColor: '#fff'      }
      ];

      return h('div', { style: { fontFamily: BODY, background: '#fff', margin: 0, padding: 0 } },
        noticeBar(),

        /* Hero */
        pageHero(resolveImage(props, hero.image), '100vh',
          h('div', null,
            h('h1', { style: { fontFamily: DISPLAY, fontSize: 'clamp(48px,9vw,88px)', textTransform: 'uppercase', color: '#fff', lineHeight: '1', letterSpacing: '-0.01em', margin: '0 0 20px' } },
              "GOD'S", h('br'), h('span', { style: { color: '#D95A2B' } }, 'HERITAGE')
            ),
            hero.tagline && h('p', { style: { fontFamily: BODY, color: 'rgba(255,255,255,0.8)', fontSize: '18px', lineHeight: '1.7', maxWidth: '520px', margin: '0 auto 28px' } }, hero.tagline),
            h('span', { style: { display: 'inline-block', background: ORANGE, color: '#fff', padding: '12px 32px', borderRadius: '999px', fontFamily: BODY, fontWeight: '700', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' } }, 'Learn More')
          )
        ),

        /* About + Mission */
        wrap('#fff', '80px 24px',
          h('div', { style: { maxWidth: '760px', margin: '0 auto', textAlign: 'center' } },
            pill('About Us'),
            data.about_body && h('p', { style: { fontFamily: BODY, fontSize: '18px', color: '#4b5563', lineHeight: '1.8', marginBottom: '48px' } }, data.about_body),
            h('hr', { style: { border: 'none', borderTop: '1px solid #f3f4f6', marginBottom: '48px' } }),
            pill('Our Mission'),
            h('h2', { style: { fontFamily: DISPLAY, fontSize: 'clamp(22px,3vw,32px)', textTransform: 'uppercase', color: NAVY, lineHeight: '1.2', marginBottom: '20px' } },
              (data.mission_heading_prefix || '') + ' ',
              h('span', { style: { color: '#D95A2B' } }, data.mission_heading_highlight || '')
            ),
            data.mission_body && h('p', { style: { fontFamily: BODY, fontSize: '16px', color: '#4b5563', lineHeight: '1.8' } }, data.mission_body)
          )
        ),

        /* 5 S Values */
        h('section', { style: { background: '#0A0A0A', padding: '80px 24px' } },
          h('div', { style: { maxWidth: '1000px', margin: '0 auto' } },
            h('div', { style: { textAlign: 'center', marginBottom: '48px' } },
              h('p', { style: { fontFamily: BODY, color: '#D95A2B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: '700', marginBottom: '10px' } }, 'What We Stand For'),
              h('h2', { style: { fontFamily: DISPLAY, fontSize: '36px', textTransform: 'uppercase', color: '#fff' } }, 'Our 5 S Values')
            ),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '14px' } },
              sValues.map(function (s, i) {
                return h('div', { key: i, style: { background: s.bg, borderRadius: '16px', padding: '24px 16px', textAlign: 'center' } },
                  h('h3', { style: { fontFamily: DISPLAY, fontSize: '20px', textTransform: 'uppercase', color: s.textColor, marginBottom: '6px' } }, s.label),
                  h('p', { style: { fontFamily: BODY, color: s.textColor, fontSize: '11px', lineHeight: '1.5', opacity: '0.85' } }, s.sub)
                );
              })
            )
          )
        ),

        /* FAQ */
        faq.length > 0 && wrap('#f9fafb', '80px 24px',
          h('div', null,
            h('div', { style: { textAlign: 'center', marginBottom: '40px' } },
              pill('Common Questions'),
              h2Anton("Parents' FAQ", NAVY)
            ),
            h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' } },
              faq.map(function (item, i) {
                return h('div', { key: i, style: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' } },
                  h('p', { style: { fontFamily: BODY, fontWeight: '700', fontSize: '15px', color: NAVY, marginBottom: '10px' } }, item.question || ''),
                  h('p', { style: { fontFamily: BODY, fontSize: '14px', color: '#4b5563', lineHeight: '1.7' } }, item.answer || '')
                );
              })
            )
          )
        ),

        /* Connect */
        (connect.instagram_handle || connect.youtube_handle) && h('section', { style: { background: '#0A0A0A', padding: '64px 24px', textAlign: 'center' } },
          h('div', { style: { maxWidth: '500px', margin: '0 auto' } },
            pill('Follow Us'),
            h2Anton("Stay Connected", '#fff'),
            h('div', { style: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' } },
              connect.instagram_handle && h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fff', color: '#0A0A0A', padding: '10px 20px', borderRadius: '999px', fontFamily: BODY, fontWeight: '700', fontSize: '12px' } }, '📸 ' + connect.instagram_handle),
              connect.youtube_handle  && h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FF0000', color: '#fff', padding: '10px 20px', borderRadius: '999px', fontFamily: BODY, fontWeight: '700', fontSize: '12px' } }, '▶ ' + connect.youtube_handle)
            )
          )
        )
      );
    } catch (err) {
      return h('div', { style: { padding: '32px', fontFamily: 'monospace', fontSize: '13px', color: '#c00', background: '#fff1f1' } }, 'Preview error: ' + err.message);
    }
  }
  window.CMS.registerPreviewTemplate('mercy-kidz', MercyKidzPreview);

  /* Fallback: register at collection level in case Decap CMS looks up
     ministries-pages entries by collection name instead of entry name. */
  function MinistriesDispatch(props) {
    try {
      var path = (props.entry && props.entry.get('path')) || '';
      if (path.indexOf('tehillah') !== -1) return TehillahPreview(props);
      if (path.indexOf('mercy-kidz') !== -1) return MercyKidzPreview(props);
      return MinistriesPreview(props);
    } catch (e) {
      return MinistriesPreview(props);
    }
  }
  window.CMS.registerPreviewTemplate('ministries-pages', MinistriesDispatch);

}());
