/**
 * @fileoverview Background javascript for AlwaysSmileAmazon.
 * @author khaneja+aas@gmail.com (Varun Khaneja)
 */

'use strict';

/**
 * @constructor
 */
function AlwaysSmileAmazon() {
    /*
     * If redirectRequest is true, the web requests to Amazon Smile page.
     * It is set by default but the user can disable it by clicking on the icon
     * in the URL bar.
     */
    this.redirectRequest = true;

    /*
     * Add a listener function to each outgoing request. That way, when a request
     * that we are interested in is being made, we can cancel/modify it.
     */
    chrome.webRequest.onBeforeRequest.addListener(
        this.onBeforeRequest.bind(this),
        {urls: ['*://www.amazon.com/*']},
        ['blocking']);

    /*
     * Add a listener function to each outgoing request. That way, when a request
     * that we are interested in is being made, we can cancel/modify it.
     */
    chrome.pageAction.onClicked.addListener(
        this.onIconClicked.bind(this));

    /*
     * Show the page action icon in the browser omnibox to enable/disable the
     * redirect.
     */
    chrome.tabs.onUpdated.addListener(function (tabId) {
        chrome.pageAction.show(tabId);
    });
}


/**
 * Gets called every time the browser is about to send a web request out.
 * If the request is for a URL we would like to rewrite, we intercept it, change
 * the hostname and send the changed request out.
 * @this {AlwaysSmileAmazon}
 * @param {chrome.webRequest.onBeforeRequest.Details} details An object that
 *     contains the details of the web request being made to Amazon servers.
 * @return {chrome.webRequest.BlockingResponse)}
 */
AlwaysSmileAmazon.prototype.onBeforeRequest = function(details) {
    if (this.redirectRequest && !this.ignoreRequest(details)) {
        console.log('onBeforeRequest: ' + JSON.stringify(details));
        details.url = details.url.replace(/www/i, 'smile');
        console.log('new URL: ' + JSON.stringify(details.url));
        return {redirectUrl: details.url};
    }
};

AlwaysSmileAmazon.prototype.ignoreRequest = function(details) {
    var method = details.method;
    var requestType = details.type;
    var alreadyRedirecting = details.url.match(/redirect=true/i);

    return method.toUpperCase() !== 'GET' ||
      requestType.toUpperCase() !== 'MAIN_FRAME' ||
      alreadyRedirecting;
};

/*jshint unused:false */
AlwaysSmileAmazon.prototype.onIconClicked = function(tab) {
    this.redirectRequest = !this.redirectRequest;
};
/*jshint unused:true */

new AlwaysSmileAmazon();
