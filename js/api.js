var api = (function () {
  var CONFIG = window.CONFIG;

  function callGas(fn, payload, retryCount) {
    if (retryCount === undefined) retryCount = 0;
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, CONFIG.TIMEOUT);

    var url = CONFIG.GAS_URL + (CONFIG.GAS_URL.indexOf('?') === -1 ? '?' : '&') + '_=' + Date.now();
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn: fn, payload: payload }),
      signal: controller.signal
    })
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (json) {
        if (json && json.success === false) {
          throw new Error(json.message || 'Request failed');
        }
        return json;
      })
      .catch(function (err) {
        clearTimeout(timer);
        var isRetryable = (err.name === 'AbortError' || err.message === 'Failed to fetch' || err.message.includes('NetworkError'));
        if (isRetryable && retryCount < CONFIG.RETRY_DELAYS.length) {
          var delay = CONFIG.RETRY_DELAYS[retryCount];
          return new Promise(function (resolve) {
            setTimeout(function () {
              resolve(callGas(fn, payload, retryCount + 1));
            }, delay);
          });
        }
        throw err;
      });
  }

  // ===== DUTY APIs =====
  function verifyUser(lineUserId) {
    return callGas('verifyUser', { lineUserId: lineUserId });
  }

  function saveDuty(data) {
    return callGas('saveDuty', data);
  }

  function getHistory(lineUserId) {
    return callGas('getHistory', { lineUserId: lineUserId });
  }

  function getAllHistory() {
    return callGas('getAllHistory', {});
  }

  // ===== SWAP APIs =====
  function getSubstituteList() {
    return callGas('getSubstituteList', {});
  }

  function submitSwap(data) {
    return callGas('submitSwap', data);
  }

  function getSwapHistory(lineUserId) {
    return callGas('getSwapHistory', { lineUserId: lineUserId });
  }

  return {
    callGas: callGas,
    verifyUser: verifyUser,
    saveDuty: saveDuty,
    getHistory: getHistory,
    getAllHistory: getAllHistory,
    getSubstituteList: getSubstituteList,
    submitSwap: submitSwap,
    getSwapHistory: getSwapHistory
  };
})();