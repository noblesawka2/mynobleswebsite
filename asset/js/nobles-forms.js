(function () {
  'use strict';

  async function submit(formType, fields) {
    const body = new FormData();
    body.set('form_type', formType);
    body.set('website', '');
    Object.entries(fields).forEach(([key, item]) => {
      if (item !== undefined && item !== null) body.set(key, item instanceof File ? item : String(item));
    });
    const response = await fetch('/api/forms/submit', {
      method: 'POST', body, headers: { Accept: 'application/json' }, credentials: 'same-origin'
    });
    let result;
    try { result = await response.json(); }
    catch { throw new Error('The form service is unavailable. Please try again later.'); }
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Your request could not be submitted.');
    }
    return result;
  }

  window.NoblesForms = { submit };
})();
