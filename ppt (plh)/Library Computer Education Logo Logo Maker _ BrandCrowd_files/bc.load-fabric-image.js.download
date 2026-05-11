function loadDesignTemplateImage(baseDesignUrl, data, preview) {
  let url = baseDesignUrl.replace('preview_name.png', preview).replace('preview_name', preview);

  return new Promise(function (resolve, reject) {

    $.ajax({
      type: 'POST',
      url: url,
      data: data,
      contentType: 'application/json'
    }).done(function (result) {
      resolve({
        type: preview,
        result: result
      });
      showSaasModalImage();
    }).fail(function (xhr, status, error) {
      reject(error);
    });
  });
}

function showSaasModalImage () {
  let loadingImage = $('[upgrade-saas-modal-loading]');
  let upgradeSaasModalImage = $('[upgrade-saas-modal-design-img]');

  loadingImage.hide();
  upgradeSaasModalImage.show();
}