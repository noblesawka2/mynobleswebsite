(function () {
  'use strict';

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function safeHttpUrl(value) {
    try {
      var url = new URL(
        String(value || '').trim(),
        window.location.origin
      );

      return (
        url.protocol === 'http:' ||
        url.protocol === 'https:'
      )
        ? url.href
        : '';
    } catch (error) {
      return '';
    }
  }

  function extractYouTubeVideoId(value) {
    var input = String(value || '').trim();

    if (!input) {
      return '';
    }

    if (/^[A-Za-z0-9_-]{11}$/.test(input)) {
      return input;
    }

    try {
      var url = new URL(input);

      var host = url.hostname
        .toLowerCase()
        .replace(/^www\./, '')
        .replace(/^m\./, '');

      var parts = url.pathname
        .split('/')
        .filter(Boolean);

      var candidate = '';

      if (host === 'youtu.be') {
        candidate = parts[0] || '';
      } else if (
        host === 'youtube.com' ||
        host === 'music.youtube.com' ||
        host === 'youtube-nocookie.com'
      ) {
        if (url.pathname === '/watch') {
          candidate =
            url.searchParams.get('v') || '';
        } else if (
          ['shorts', 'embed', 'live']
            .indexOf(parts[0]) !== -1
        ) {
          candidate = parts[1] || '';
        }
      }

      return /^[A-Za-z0-9_-]{11}$/.test(
        candidate
      )
        ? candidate
        : '';
    } catch (error) {
      return '';
    }
  }

  function isYouTubeItem(item) {
    var type = String(
      item && item.file_type || ''
    ).toLowerCase();

    return (
      type === 'youtube' ||
      Boolean(
        extractYouTubeVideoId(
          item && item.file_url
        )
      )
    );
  }

  function youtubeWatchUrl(videoId) {
    return (
      'https://www.youtube.com/watch?v=' +
      encodeURIComponent(videoId)
    );
  }

  function youtubeEmbedUrl(
    videoId,
    autoplay
  ) {
    var params = new URLSearchParams();

    params.set('rel', '0');
    params.set('playsinline', '1');
    params.set('modestbranding', '1');

    if (autoplay) {
      params.set('autoplay', '1');
    }

    if (
      window.location.origin &&
      window.location.origin !== 'null'
    ) {
      params.set(
        'origin',
        window.location.origin
      );
    }

    return (
      'https://www.youtube.com/embed/' +
      encodeURIComponent(videoId) +
      '?' +
      params.toString()
    );
  }

  function youtubeThumbnailUrl(videoId) {
    return (
      'https://i.ytimg.com/vi/' +
      encodeURIComponent(videoId) +
      '/hqdefault.jpg'
    );
  }

  function ensureYouTubeStyles() {
    if (
      document.getElementById(
        'noblesGalleryYouTubeStyles'
      )
    ) {
      return;
    }

    var style = document.createElement(
      'style'
    );

    style.id =
      'noblesGalleryYouTubeStyles';

    style.textContent = [
      '.gallery-youtube-thumb{' +
        'position:relative;' +
        'display:block;' +
        'width:100%;' +
        'padding:0;' +
        'border:0;' +
        'background:#0D0D14;' +
        'cursor:pointer;' +
        'overflow:hidden;' +
        'aspect-ratio:16/9' +
      '}',

      '.gallery-youtube-thumb img{' +
        'width:100%;' +
        'height:100%;' +
        'object-fit:cover;' +
        'display:block' +
      '}',

      '.gallery-youtube-thumb::after{' +
        'content:"";' +
        'position:absolute;' +
        'inset:0;' +
        'background:linear-gradient(' +
          '180deg,' +
          'rgba(0,0,0,.03),' +
          'rgba(0,0,0,.25)' +
        ')' +
      '}',

      '.gallery-youtube-play{' +
        'position:absolute;' +
        'left:50%;' +
        'top:50%;' +
        'z-index:2;' +
        'transform:translate(-50%,-50%);' +
        'width:66px;' +
        'height:46px;' +
        'border-radius:14px;' +
        'background:#ff0033;' +
        'display:grid;' +
        'place-items:center;' +
        'box-shadow:0 12px 30px rgba(0,0,0,.35)' +
      '}',

      '.gallery-youtube-play svg{' +
        'width:22px;' +
        'height:22px;' +
        'margin-left:3px;' +
        'color:#fff;' +
        'fill:currentColor' +
      '}',

      '.gallery-youtube-thumb:focus-visible,' +
      '.gallery-media-button:focus-visible{' +
        'outline:3px solid rgba(92,0,140,.35);' +
        'outline-offset:3px' +
      '}',

      '.gallery-media-button{' +
        'display:block;' +
        'width:100%;' +
        'padding:0;' +
        'border:0;' +
        'background:transparent;' +
        'cursor:pointer;' +
        'text-align:inherit' +
      '}',

      '.gallery-type-badge{' +
        'display:inline-flex;' +
        'align-items:center;' +
        'gap:6px;' +
        'margin-bottom:8px;' +
        'padding:4px 9px;' +
        'border-radius:999px;' +
        'background:#FFF7E9;' +
        'color:#5C008C;' +
        'font-size:.68rem;' +
        'font-weight:800;' +
        'letter-spacing:.04em;' +
        'text-transform:uppercase' +
      '}',

      '.gallery-type-badge i{' +
        'color:#F49C00' +
      '}',

      '.gallery-public-actions{' +
        'display:flex;' +
        'flex-wrap:wrap;' +
        'gap:8px;' +
        'margin-top:12px' +
      '}',

      '#lightbox iframe{' +
        'width:min(960px,90vw);' +
        'aspect-ratio:16/9;' +
        'border:0;' +
        'border-radius:12px;' +
        'box-shadow:0 30px 80px rgba(0,0,0,.6);' +
        'background:#000' +
      '}',

      '@media(max-width:640px){' +
        '.gallery-youtube-play{' +
          'width:58px;' +
          'height:40px;' +
          'border-radius:12px' +
        '}' +
      '}'
    ].join('');

    document.head.appendChild(style);
  }

  function openGalleryLightbox(item) {
    var lightbox =
      document.getElementById(
        'lightbox'
      );

    var content =
      document.getElementById(
        'lightboxContent'
      );

    if (
      !lightbox ||
      !content ||
      !item
    ) {
      return;
    }

    var title = escapeHtml(
      item.title || 'Gallery item'
    );

    var source = safeHttpUrl(
      item.file_url
    );

    var type = String(
      item.file_type || ''
    ).toLowerCase();

    if (isYouTubeItem(item)) {
      var videoId =
        extractYouTubeVideoId(
          item.file_url
        );

      if (!videoId) {
        return;
      }

      content.innerHTML =
        '<div style="width:min(960px,90vw)">' +

          '<iframe ' +
            'src="' +
              escapeHtml(
                youtubeEmbedUrl(
                  videoId,
                  true
                )
              ) +
            '" ' +

            'title="' + title + '" ' +

            'referrerpolicy="' +
              'strict-origin-when-cross-origin' +
            '" ' +

            'allow="' +
              'accelerometer; autoplay; ' +
              'clipboard-write; encrypted-media; ' +
              'gyroscope; picture-in-picture; ' +
              'web-share' +
            '" ' +

            'allowfullscreen>' +
          '</iframe>' +

          '<div style="' +
            'text-align:center;' +
            'margin-top:12px' +
          '">' +

            '<a ' +
              'href="' +
                escapeHtml(
                  youtubeWatchUrl(videoId)
                ) +
              '" ' +

              'target="_blank" ' +
              'rel="noopener noreferrer" ' +

              'style="' +
                'color:#fff;' +
                'text-decoration:underline' +
              '">' +

              'Open on YouTube if playback is restricted' +

            '</a>' +

          '</div>' +

        '</div>';
    } else if (
      type === 'video' &&
      source
    ) {
      content.innerHTML =
        '<video ' +
          'src="' +
            escapeHtml(source) +
          '" ' +
          'controls ' +
          'autoplay ' +
          'playsinline ' +
          'style="' +
            'max-width:90vw;' +
            'max-height:85vh' +
          '">' +
        '</video>';
    } else if (source) {
      content.innerHTML =
        '<img ' +
          'src="' +
            escapeHtml(source) +
          '" ' +
          'alt="' + title + '" ' +
          'style="' +
            'max-width:90vw;' +
            'max-height:85vh;' +
            'object-fit:contain' +
          '">' ;
    } else {
      return;
    }

    lightbox.classList.add('active');
    lightbox.style.display = 'flex';

    document.body.style.overflow =
      'hidden';
  }

  function closeGalleryLightbox() {
    var lightbox =
      document.getElementById(
        'lightbox'
      );

    var content =
      document.getElementById(
        'lightboxContent'
      );

    if (!lightbox) {
      return;
    }

    lightbox.classList.remove('active');
    lightbox.style.display = 'none';

    if (content) {
      content.innerHTML = '';
    }

    document.body.style.overflow = '';
  }

  function renderMedia(item, title) {
    var source = safeHttpUrl(
      item.file_url
    );

    var type = String(
      item.file_type || 'image'
    ).toLowerCase();

    if (isYouTubeItem(item)) {
      var videoId =
        extractYouTubeVideoId(
          item.file_url
        );

      if (!videoId) {
        return (
          '<div style="' +
            'padding:28px;' +
            'background:#fff3cd;' +
            'color:#856404' +
          '">' +
            'Invalid YouTube link' +
          '</div>'
        );
      }

      return (
        '<button ' +
          'class="gallery-youtube-thumb" ' +
          'type="button" ' +
          'data-gallery-open ' +
          'aria-label="Play ' +
            title +
          '">' +

          '<img ' +
            'src="' +
              escapeHtml(
                youtubeThumbnailUrl(videoId)
              ) +
            '" ' +
            'alt="' + title + '" ' +
            'loading="lazy" ' +
            'decoding="async">' +

          '<span ' +
            'class="gallery-youtube-play" ' +
            'aria-hidden="true">' +
            '<i data-lucide="play" width="22" height="22"></i>' +
          '</span>' +

        '</button>'
      );
    }

    if (
      type === 'video' &&
      source
    ) {
      return (
        '<button ' +
          'class="gallery-media-button" ' +
          'type="button" ' +
          'data-gallery-open ' +
          'aria-label="Play ' +
            title +
          '">' +

          '<video ' +
            'src="' +
              escapeHtml(source) +
            '" ' +
            'muted ' +
            'playsinline ' +
            'preload="metadata">' +
          '</video>' +

        '</button>'
      );
    }

    if (source) {
      return (
        '<button ' +
          'class="gallery-media-button" ' +
          'type="button" ' +
          'data-gallery-open ' +
          'aria-label="Open ' +
            title +
          '">' +

          '<img ' +
            'src="' +
              escapeHtml(source) +
            '" ' +
            'alt="' + title + '" ' +
            'loading="lazy" ' +
            'decoding="async">' +

        '</button>'
      );
    }

    return (
      '<div style="' +
        'padding:28px;' +
        'background:#f8d7da;' +
        'color:#721c24' +
      '">' +
        'Media unavailable' +
      '</div>'
    );
  }

  function renderGalleryGrid(
    items,
    containerId,
    isAdmin,
    onDelete
  ) {
    ensureYouTubeStyles();

    var container =
      typeof containerId === 'string'
        ? document.getElementById(
            containerId
          )
        : containerId;

    if (!container) {
      return;
    }

    var records = Array.isArray(items)
      ? items
      : [];

    container.__noblesGalleryItems =
      records;

    if (!records.length) {
      container.innerHTML =
        '<div ' +
          'class="empty-state" ' +
          'style="grid-column:1/-1">' +

          '<i data-lucide="images" width="1em" height="1em"></i>' +
          '<p>No gallery items yet.</p>' +

        '</div>';

      return;
    }

    container.innerHTML = records
      .map(function (item, index) {
        var itemId = escapeHtml(
          item.id ||
          'gallery-' + index
        );

        var title = escapeHtml(
          item.title ||
          'Untitled gallery item'
        );

        var description = escapeHtml(
          item.description || ''
        );

        var type = isYouTubeItem(item)
          ? 'youtube'
          : String(
              item.file_type || 'image'
            ).toLowerCase();

        var typeLabel =
          type === 'youtube'
            ? 'YouTube video'
            : type === 'video'
              ? 'Uploaded video'
              : 'Image';

        var icon =
          type === 'youtube'
            ? '<i class="fa-brands fa-youtube"></i>'
            : type === 'video'
              ? '<i data-lucide="circle-play" width="1em" height="1em"></i>'
              : '<i data-lucide="image" width="1em" height="1em"></i>';

        var videoId =
          type === 'youtube'
            ? extractYouTubeVideoId(
                item.file_url
              )
            : '';

        var actions = '';

        if (isAdmin) {
          actions =
            '<div class="gallery-item-actions">' +

              (
                videoId
                  ? '<a ' +
                      'class="btn btn-outline btn-sm" ' +
                      'href="' +
                        escapeHtml(
                          youtubeWatchUrl(videoId)
                        ) +
                      '" ' +
                      'target="_blank" ' +
                      'rel="noopener noreferrer">' +

                      '<i class="fa-brands fa-youtube"></i> ' +
                      'Open YouTube' +

                    '</a>'
                  : ''
              ) +

              '<button ' +
                'type="button" ' +
                'class="btn btn-danger btn-sm" ' +
                'data-gallery-delete="' +
                  itemId +
                '">' +

                '<i data-lucide="trash-2" width="1em" height="1em"></i> ' +
                'Delete' +

              '</button>' +

            '</div>';
        } else {
          actions =
            '<div class="gallery-public-actions">' +

              '<button ' +
                'type="button" ' +
                'class="btn btn-sm btn-primary" ' +
                'data-gallery-open>' +

                '<i data-lucide="eye" width="1em" height="1em"></i> ' +

                (
                  type === 'youtube'
                    ? 'Watch'
                    : 'View'
                ) +

              '</button>' +

              (
                type !== 'youtube' &&
                safeHttpUrl(item.file_url)
                  ? '<a ' +
                      'href="' +
                        escapeHtml(
                          safeHttpUrl(
                            item.file_url
                          )
                        ) +
                      '" ' +
                      'download ' +
                      'class="btn btn-sm btn-outline">' +

                      '<i data-lucide="download" width="1em" height="1em"></i> ' +
                      'Download' +

                    '</a>'
                  : ''
              ) +

            '</div>';
        }

        return (
          '<article ' +
            'class="gallery-item" ' +
            'data-gallery-item-id="' +
              itemId +
            '" ' +
            'data-gallery-index="' +
              index +
            '">' +

            renderMedia(item, title) +

            '<div class="gallery-item-info">' +

              '<span class="gallery-type-badge">' +
                icon +
                escapeHtml(typeLabel) +
              '</span>' +

              '<h3>' + title + '</h3>' +

              (
                description
                  ? '<p>' +
                      description +
                    '</p>'
                  : ''
              ) +

              actions +

            '</div>' +

          '</article>'
        );
      })
      .join('');

    container
      .querySelectorAll(
        '[data-gallery-open]'
      )
      .forEach(function (button) {
        button.addEventListener(
          'click',
          function (event) {
            event.preventDefault();
            event.stopPropagation();

            var article = button.closest(
              '[data-gallery-index]'
            );

            var index = Number(
              article &&
              article.dataset.galleryIndex
            );

            var item = records[index];

            if (item) {
              openGalleryLightbox(item);
            }
          }
        );
      });

    if (
      isAdmin &&
      typeof onDelete === 'function'
    ) {
      container
        .querySelectorAll(
          '[data-gallery-delete]'
        )
        .forEach(function (button) {
          button.addEventListener(
            'click',
            function () {
              onDelete(
                button.getAttribute(
                  'data-gallery-delete'
                )
              );
            }
          );
        });
    }
  }

  function bindLightboxEvents() {
    var closeButton =
      document.getElementById(
        'lightboxClose'
      );

    var lightbox =
      document.getElementById(
        'lightbox'
      );

    if (
      closeButton &&
      !closeButton.dataset
        .noblesGalleryBound
    ) {
      closeButton.dataset
        .noblesGalleryBound = 'true';

      closeButton.addEventListener(
        'click',
        closeGalleryLightbox
      );
    }

    if (
      lightbox &&
      !lightbox.dataset
        .noblesGalleryBound
    ) {
      lightbox.dataset
        .noblesGalleryBound = 'true';

      lightbox.addEventListener(
        'click',
        function (event) {
          if (
            event.target === lightbox
          ) {
            closeGalleryLightbox();
          }
        }
      );
    }

    if (
      !document.documentElement.dataset
        .noblesGalleryEscapeBound
    ) {
      document.documentElement.dataset
        .noblesGalleryEscapeBound =
          'true';

      document.addEventListener(
        'keydown',
        function (event) {
          if (event.key === 'Escape') {
            closeGalleryLightbox();
          }
        }
      );
    }
  }

  window.extractYouTubeVideoId =
    extractYouTubeVideoId;

  window.youtubeWatchUrl =
    youtubeWatchUrl;

  window.youtubeEmbedUrl =
    youtubeEmbedUrl;

  window.youtubeThumbnailUrl =
    youtubeThumbnailUrl;

  window.renderGalleryGrid =
    renderGalleryGrid;

  window.openGalleryLightbox =
    openGalleryLightbox;

  window.closeGalleryLightbox =
    closeGalleryLightbox;

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      function () {
        ensureYouTubeStyles();
        bindLightboxEvents();
      },
      { once: true }
    );
  } else {
    ensureYouTubeStyles();
    bindLightboxEvents();
  }
})();
