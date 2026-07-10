var liffApp = (function () {
  function initLiff(liffId) {
    return new Promise(function (resolve, reject) {
      liff.init({ liffId: liffId })
        .then(function () {
          if (!liff.isLoggedIn()) {
            liff.login();
            reject(new Error('User not logged in, redirecting...'));
            return;
          }
          return liff.getProfile();
        })
        .then(function (profile) {
          resolve(profile);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  }

  return {
    initLiff: initLiff
  };
})();