(function () {
  'use strict';

  var SUPABASE_URL =
    'https://zkijxwuipxgqcofekcco.supabase.co';

  var SUPABASE_ANON_KEY =
    'sb_publishable_G32CP-7BYGL1oJ8nk8lMmw_Qs7AE8jd';

  var publicGalleryClient = null;
  var isLoading = false;

  function getSupabaseClient() {
    if (
      window.supabaseClient &&
      typeof window.supabaseClient.from ===
        'function'
    ) {
      return window.supabaseClient;
    }

    if (publicGalleryClient) {
      return publicGalleryClient;
    }

    if (
      !window.supabase ||
      typeof window.supabase.createClient !==
        'function'
    ) {
      throw new Error(
        'Supabase JavaScript is not loaded. ' +
        'Add the Supabase CDN script before ' +
        'gallery-client.js.'
      );
    }

    publicGalleryClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

    return publicGalleryClient;
  }

  function showGalleryError(message) {
    var grid =
      document.getElementById(
        'galleryGrid'
      );

    var noItems =
      document.getElementById(
        'noItems'
      );

    if (noItems) {
      noItems.style.display = 'none';
    }

    if (grid) {
      grid.innerHTML =
        '<p style="' +
          'grid-column:1/-1;' +
          'text-align:center;' +
          'color:#b42318;' +
          'padding:30px 12px' +
        '">' +

          message +

        '</p>';
    }
  }

  async function loadPublicGallery() {
    if (isLoading) {
      return;
    }

    var grid =
      document.getElementById(
        'galleryGrid'
      );

    var noItems =
      document.getElementById(
        'noItems'
      );

    if (!grid) {
      return;
    }

    if (
      typeof window.renderGalleryGrid !==
      'function'
    ) {
      showGalleryError(
        'Gallery support did not load. ' +
        'Check the JavaScript file order.'
      );

      return;
    }

    isLoading = true;

    try {
      var client =
        getSupabaseClient();

      var result = await client
        .from('gallery_items')
        .select('*')
        .order(
          'created_at',
          { ascending: false }
        );

      if (result.error) {
        throw result.error;
      }

      var items = Array.isArray(
        result.data
      )
        ? result.data
        : [];

      if (!items.length) {
        grid.innerHTML = '';

        if (noItems) {
          noItems.style.display =
            'block';
        }

        return;
      }

      if (noItems) {
        noItems.style.display =
          'none';
      }

      window.renderGalleryGrid(
        items,
        grid,
        false
      );
    } catch (error) {
      console.error(
        'Error loading Nobles gallery:',
        error
      );

      showGalleryError(
        'The gallery could not be loaded. ' +
        'Please refresh the page.'
      );
    } finally {
      isLoading = false;
    }
  }

  function startGallery() {
    loadPublicGallery();
  }

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      startGallery,
      { once: true }
    );
  } else {
    startGallery();
  }

  window.loadPublicGallery =
    loadPublicGallery;
})();