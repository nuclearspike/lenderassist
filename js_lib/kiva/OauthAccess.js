/**
 * OauthAccess.js - v0.1.2
 * Copyright (c) 2015 Kiva Microfunds
 *
 * Licensed under the MIT license.
 * https://github.com/kiva/OauthAccess/blob/master/license.txt
 */
define(function () {

    'use strict';


    /**
     *
     * @param settings
     * @constructor
     */
    function OauthAccess(settings) {
        OauthAccess.extend(this, settings);
    }


    OauthAccess.extend = function (target, obj) {
        for(var key in obj) {
            if (obj.hasOwnProperty(key)) {
                target[key] = obj[key];
            }
        }
    };


    /**
     * Converts a data object into an array
     *
     * @param obj
     * @returns {Array}
     */
    OauthAccess.arrayify = function (obj) {
        if (typeof obj != 'object') {
            throw 'Data must be an [object]';
        }

        var arr = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                arr.push({
                    key: key
                    , val: obj[key]
                });
            }
        }

        return arr;
    };


    OauthAccess.generateNonce = function () {
        return Math.random() * 10000000;
    };


    OauthAccess.generateTimestamp = function () {
        return parseInt((new Date()).getTime()/1000, 10);
    };


    OauthAccess.serializeParams = function (params) {
        var str = '', i;

        for (i = 0; i < params.length; i++) {
            str += params[i].key + '%3D' + params[i].val;
            if (i < params.length - 1) {
                str += '%26';
            }
        }

        return str;
    };


    /**
     *
     * @param queryStr
     * @returns {Array}
     */
    OauthAccess.parseQueryParams = function (queryStr) {
        var split
            , queryParamsArray = []
            , pairs = queryStr.split('&');

        for (var i = 0; i < pairs.length; i++) {
            split = pairs[i].split('=');
            queryParamsArray.push({key: split[0], val: split[1]});
        }

        return queryParamsArray;
    };


    OauthAccess.encodeParams = function (params) {
        var i, newParams = [];

        for (i = 0; i < params.length; i++) {
            newParams[i] = {
                key: encodeURIComponent(params[i].key)
                , val: encodeURIComponent(params[i].val)
            };
        }

        return newParams;
    };


    OauthAccess.sortParams = function (params) {
        return params.sort(function (a, b) {
            var aKey = a.key, bKey = b.key;

            if (aKey < bKey) {
                return -1;
            }

            if (aKey > bKey) {
                return 1;
            }

            return 0;
        });
    };


    /**
     *
     * @param {String} httpMethod
     * @param {String} baseUrl
     * @param {Array} params
     * @param {String} nonce
     * @param {String} timestamp
     * @param {String} encToken
     * @param {String} encTokenSecret
     * @param {String} signatureMethod
     * @param {String} encKey
     * @param {String} encCallback
     * @return {String}
     */
    OauthAccess.generateSignature = function (httpMethod, baseUrl, params, nonce, timestamp, encToken, encTokenSecret, signatureMethod, encKey, encCallback) {
        var base;

        params.push({key: 'oauth_callback', val: encCallback});
        params.push({key: 'oauth_consumer_key', val: encKey});
        params.push({key: 'oauth_nonce', val: nonce});
        params.push({key: 'oauth_signature_method', val: signatureMethod});
        params.push({key: 'oauth_timestamp', val: timestamp});
        params.push({key: 'oauth_token', val: encToken});
        params.push({key: 'oauth_version', val: '1.0'});

        params = OauthAccess.sortParams(params);
        params = OauthAccess.encodeParams(params);
        params = OauthAccess.serializeParams(params);

        base = httpMethod.toUpperCase() + '&' + encodeURIComponent(baseUrl).toString() + '&' + params;
        return b64_hmac_sha1(encTokenSecret, base) + '=';
    };


    /**
     *
     * @param httpMethod
     * @param url
     * @param params
     * @param token
     * @param tokenSecret
     * @param signatureMethod
     * @param key
     * @param callback
     * @returns {string}
     */
    OauthAccess.generateHeader = function (httpMethod, url, params, token, tokenSecret, signatureMethod, key, callback) {
        params = params
            ? OauthAccess.arrayify(params)
            : [];

        if (typeof httpMethod != 'string') {
            httpMethod = 'GET';
        }

        if (! url) {
            throw 'Unable to generate an authorization header: No "url" provided';
        }

        tokenSecret = tokenSecret || '';
        callback = encodeURIComponent(callback);
        key = encodeURIComponent(key);
        token = encodeURIComponent(token);

        var baseUrl, signature
            , nonce = OauthAccess.generateNonce()
            , timestamp = OauthAccess.generateTimestamp()
            , queryStart = url.indexOf('?');

        if (queryStart > -1) {
            baseUrl = url.slice(0, queryStart);
            params = params.concat(OauthAccess.parseQueryParams(url.slice(queryStart + 1)));
        } else {
            baseUrl = url;
        }

        signature = OauthAccess.generateSignature(httpMethod, baseUrl, params, nonce, timestamp, token, encodeURIComponent(tokenSecret), signatureMethod, key, callback);

        return 'OAuth oauth_nonce="' + encodeURIComponent(nonce) +
            '",oauth_callback="' + callback +
            '",oauth_signature_method="' + signatureMethod + '"' +
            ',oauth_timestamp="' + encodeURIComponent(timestamp) +
            '",oauth_consumer_key="' + key +
            '",oauth_signature="' + signature +
            '",oauth_token="' + token +
            '",oauth_version="1.0"';
    };


    OauthAccess.prototype = {
        generateHeader: function (httpMethod, baseUrl, params) {
            var accessTokens = this.accessTokens;
            return OauthAccess.generateHeader(httpMethod, baseUrl, params, accessTokens.token, accessTokens.tokenSecret, this.signatureMethod, this.key, this.callback);
        }
    };

    /*
     * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
     * in FIPS PUB 180-1
     * Version 2.1a Copyright Paul Johnston 2000 - 2002.
     * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
     * Distributed under the BSD License
     * See http://pajhome.org.uk/crypt/md5 for details.
     */

    /*
     * Configurable variables. You may need to tweak these to be compatible with
     * the server-side, but the defaults work in most cases.
     */
    var hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
    var b64pad  = ""; /* base-64 pad character. "=" for strict RFC compliance   */
    var chrsz   = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

    /*
     * These are the functions you'll usually want to call
     * They take string arguments and return either hex or base-64 encoded strings
     */
    function hex_sha1(s){return binb2hex(core_sha1(str2binb(s),s.length * chrsz));}
    function b64_sha1(s){return binb2b64(core_sha1(str2binb(s),s.length * chrsz));}
    function str_sha1(s){return binb2str(core_sha1(str2binb(s),s.length * chrsz));}
    function hex_hmac_sha1(key, data){ return binb2hex(core_hmac_sha1(key, data));}
    function b64_hmac_sha1(key, data){ return binb2b64(core_hmac_sha1(key, data));}
    function str_hmac_sha1(key, data){ return binb2str(core_hmac_sha1(key, data));}

    /*
     * Perform a simple self-test to see if the VM is working
     */
    function sha1_vm_test()
    {
        return hex_sha1("abc") == "a9993e364706816aba3e25717850c26c9cd0d89d";
    }

    /*
     * Calculate the SHA-1 of an array of big-endian words, and a bit length
     */
    function core_sha1(x, len)
    {
        /* append padding */
        x[len >> 5] |= 0x80 << (24 - len % 32);
        x[((len + 64 >> 9) << 4) + 15] = len;

        var w = Array(80);
        var a =  1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d =  271733878;
        var e = -1009589776;

        for(var i = 0; i < x.length; i += 16)
        {
            var olda = a;
            var oldb = b;
            var oldc = c;
            var oldd = d;
            var olde = e;

            for(var j = 0; j < 80; j++)
            {
                if(j < 16) w[j] = x[i + j];
                else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
                var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                    safe_add(safe_add(e, w[j]), sha1_kt(j)));
                e = d;
                d = c;
                c = rol(b, 30);
                b = a;
                a = t;
            }

            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
            e = safe_add(e, olde);
        }
        return Array(a, b, c, d, e);

    }

    /*
     * Perform the appropriate triplet combination function for the current
     * iteration
     */
    function sha1_ft(t, b, c, d)
    {
        if(t < 20) return (b & c) | ((~b) & d);
        if(t < 40) return b ^ c ^ d;
        if(t < 60) return (b & c) | (b & d) | (c & d);
        return b ^ c ^ d;
    }

    /*
     * Determine the appropriate additive constant for the current iteration
     */
    function sha1_kt(t)
    {
        return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
            (t < 60) ? -1894007588 : -899497514;
    }

    /*
     * Calculate the HMAC-SHA1 of a key and some data
     */
    function core_hmac_sha1(key, data)
    {
        var bkey = str2binb(key);
        if(bkey.length > 16) bkey = core_sha1(bkey, key.length * chrsz);

        var ipad = Array(16), opad = Array(16);
        for(var i = 0; i < 16; i++)
        {
            ipad[i] = bkey[i] ^ 0x36363636;
            opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }

        var hash = core_sha1(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
        return core_sha1(opad.concat(hash), 512 + 160);
    }

    /*
     * Add integers, wrapping at 2^32. This uses 16-bit operations internally
     * to work around bugs in some JS interpreters.
     */
    function safe_add(x, y)
    {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    /*
     * Bitwise rotate a 32-bit number to the left.
     */
    function rol(num, cnt)
    {
        return (num << cnt) | (num >>> (32 - cnt));
    }

    /*
     * Convert an 8-bit or 16-bit string to an array of big-endian words
     * In 8-bit function, characters >255 have their hi-byte silently ignored.
     */
    function str2binb(str)
    {
        var bin = Array();
        var mask = (1 << chrsz) - 1;
        for(var i = 0; i < str.length * chrsz; i += chrsz)
            bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (32 - chrsz - i%32);
        return bin;
    }

    /*
     * Convert an array of big-endian words to a string
     */
    function binb2str(bin)
    {
        var str = "";
        var mask = (1 << chrsz) - 1;
        for(var i = 0; i < bin.length * 32; i += chrsz)
            str += String.fromCharCode((bin[i>>5] >>> (32 - chrsz - i%32)) & mask);
        return str;
    }

    /*
     * Convert an array of big-endian words to a hex string.
     */
    function binb2hex(binarray)
    {
        var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        var str = "";
        for(var i = 0; i < binarray.length * 4; i++)
        {
            str += hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8+4)) & 0xF) +
            hex_tab.charAt((binarray[i>>2] >> ((3 - i%4)*8  )) & 0xF);
        }
        return str;
    }

    /*
     * Convert an array of big-endian words to a base-64 string
     */
    function binb2b64(binarray)
    {
        var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var str = "";
        for(var i = 0; i < binarray.length * 4; i += 3)
        {
            var triplet = (((binarray[i   >> 2] >> 8 * (3 -  i   %4)) & 0xFF) << 16)
                | (((binarray[i+1 >> 2] >> 8 * (3 - (i+1)%4)) & 0xFF) << 8 )
                |  ((binarray[i+2 >> 2] >> 8 * (3 - (i+2)%4)) & 0xFF);
            for(var j = 0; j < 4; j++)
            {
                if(i * 8 + j * 6 > binarray.length * 32) str += b64pad;
                else str += tab.charAt((triplet >> 6*(3-j)) & 0x3F);
            }
        }
        return str;
    }

    return OauthAccess;
});