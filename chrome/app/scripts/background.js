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
     * @const{String}
     * The name of the GET argument to detect if a redirect is already being
     * made.
     */
    this.REDIRECT_PARAMETER = 'redirect';

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
    chrome.pageAction.onClicked.addListener(this.onIconClicked.bind(this));

    /*
     * Show the page action icon in the browser omnibox to enable/disable the
     * redirect.
     */
    chrome.tabs.onUpdated.addListener(this.onTabUpdated.bind(this));
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
        var anchor = this.getElementFromUrl(details.url);
        anchor.hostname = anchor.hostname.replace(/^www/i, 'smile');
        return {redirectUrl: anchor.href};
    }
};

AlwaysSmileAmazon.prototype.ignoreRequest = function(details) {
    var method = details.method;
    var requestType = details.type;
    var anchorElement = this.getElementFromUrl(details.url);
    var params = this.getParamsFromElement(anchorElement);
    var alreadyRedirecting = params.hasOwnProperty(this.REDIRECT_PARAMETER) &&
        params[this.REDIRECT_PARAMETER].toUpperCase() === 'TRUE';

    return method.toUpperCase() !== 'GET' ||
        requestType.toUpperCase() !== 'MAIN_FRAME' ||
        alreadyRedirecting;
};

/**
 * Returns an anchor element that points to the given URL.
 * This is done to parse the URL and get individual components.
 * @this {AlwaysSmileAmazon}
 * @param {string} url The URL to which the element should point to.
 */
AlwaysSmileAmazon.prototype.getElementFromUrl = function(url)
{
    var anchorElement = document.createElement('a');
    anchorElement.href = url;
    return anchorElement;
};

/**
 * Get a dictionary of the GET parameters and their value in the URL that the
 * given anchor element points to.
 * @this {AlwaysSmileAmazon}
 * @param {Object} element An anchor element that points to the URL being
 *     requested.
 * @return {Object.<String, String>} A dictionary of GET parameters in the
 *     URL.
 */
AlwaysSmileAmazon.prototype.getParamsFromElement = function(element)
{
    var params = {};
    if (element.search && element.search.length > 1) {
        var parts = element.search.substring(1);
        var vars = parts.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            var key = decodeURIComponent(pair[0]);
            var value = decodeURIComponent(pair[1] ? pair[1] : '');
            params[key] = value;
        }
    }

    return params;
};

AlwaysSmileAmazon.prototype.onTabUpdated = function(tabId, changeInfo, tab) {
    var anchor = this.getElementFromUrl(tab.url);
    if (anchor.hostname.match(/\.amazon.com$/i)) {
        chrome.pageAction.show(tabId);
    } else {
        chrome.pageAction.hide(tabId);
    }
};

/*jshint unused:false */
AlwaysSmileAmazon.prototype.onIconClicked = function(tab) {
    this.redirectRequest = !this.redirectRequest;
};
/*jshint unused:true */

new AlwaysSmileAmazon();
