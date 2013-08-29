/*
 ojks - a tiny asynchronous-friendly JS unit test framework

 Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 Available on GitHub: https://github.com/gkindel/okjs

 Author: Greg Kindel
 Created: "Unit.js" Spring 2011
 Updated; added JSON.stringify for object/array comparison, Aug 2013
 */

(function () {

    var defaults = {
        verbose : true,
        exceptions: false,
        timeout : 5000
    };

    var okjs = function (options) {
        if( !(this instanceof okjs) )
            return  new okjs( options );

        this.options = merge(defaults, options);
        this.location = window.location.toString();

        if( window.frameElement && window.frameElement.__OK_PARENT__ ){
            this._parent = window.frameElement.__OK_PARENT__;
        }

        this.logger = this.options.logger;

        if( ! this.logger ) {
            DefaultLogger(this);
        }

        this._init();
    };

    window.okjs = okjs;

    okjs.prototype = {

        // public

        assert : function (message, result, expected) {
            var error = "";
            var hasExpected = arguments.length == 3;

            // if expected defined, then do strict compare
            if( hasExpected   && ! compare(result, expected) )
                error = "Expected: " + expected + ", got " + result;

            // else test for true-ish
            if( ! hasExpected && ! Boolean(result) )
                error = "Expected: " + true + ", got " + result;

            this.report(message, error);
        },

        forbid : function (message, result, forbid) {
            var error = "";
            var hasForbid = arguments.length == 3;

            // if expected defined, then do strict compare
            if( hasForbid && compare(result, forbid) )
                error = "Forbidden Result: " + result;

            // else test for false-ish
            if( ! hasForbid && Boolean(result) )
                error = "Expected: " + false + ", got " + result;

            this.report(message, error);
        },

        test : function (message, code, expectErrors) {
            var test = {
                message: message,
                code : code,
                expectErrors : expectErrors
            };

            // if subtest, schedule immediately
            if( this._running )
                this._subtests.push(test);

            // else tag on end
            else
                this._queue.push(test);
        },

        callback : function (message, callback, scope, timeout) {

            // legacy syntax:  function (message, timeout, callback, scope)
            if( typeof callback == "number") {
                timeout = arguments[1];
                callback = arguments[2];
                scope = arguments[3];
            }

            if( timeout == null )
                timeout = this.options.timeout;

            if( callback && ! (callback instanceof Function) )
                throw "okjs.callback() invalid function: " + callback;

            this._hold();

            // dead man's trigger
            var active = true;
            var timer = setTimeout( this._bind( function () {
                active = false;
                this.report(message, "Timeout: " + timeout + "ms");
                this._release();
            }), timeout);

            // wrap callback in exception-catching environment
            return this._bind( function () {
                clearTimeout(timer);
                if(! active )
                    return;
                active = false;
                this._eval(message, callback, scope, arguments);
                this._release();
            })
        },

        event : function (message, object, type, callback, scope, timeout) {
            if( callback && ! (callback instanceof Function) )
                throw "okjs.listen() invalid function: " + callback;

            // optional form: function (message, object, type, callback, timeout) {
            if( typeof scope == "number"){
                timeout = scope;
                scope = null;
            }

            var wrapped = this.callback(message, callback, scope, timeout);
            var onEvent = function () {
                object.removeEventListener(type, onEvent);
                wrapped.apply(this, arguments);
            };
            object.addEventListener( type, onEvent );
        },

        exception : function (message, callback, scope) {
            var error = "Exception not fired";
            try {
                callback && callback.apply(scope, callback);
            }
            catch (e) {
                error = "";
            }
            this.report(message, error);
        },

        url : function (message, url) {
            var test = {
                message: message,
                url : url
            };

            if( this._running )
                this._queue.unshift(test);
            else
                this._queue.push(test);
        },

        log : function ( message) {
            this.logger.onInfo({
                message: message
            });
        },

        skip : function ( message) {
            this.skipped++;
            this.logger.onSkip({
                message: message
            });
        },

        report : function ( message, error) {

            if( error && ! this._expectErrors ) {
                this.failed++;
                this.logger.onFail({
                    message: message,
                    error: error
                });
            }
            else {
                this.passed++;
                this.logger.onSuccess({
                    message: message
                });
            }
        },

        start : function () {
            this._running = true;
            this._started = now();
            this._resume();
        },

        // logger utilities

        time : function () {
            if(! this._started )
                return null;
            return now() - this._started;
        },


        // "private"

        _init : function () {
            this._queue = [];
            this._subtests = [];
            this._blocks = 0;
            this.skipped = 0;
            this.failed = 0;
            this.passed = 0;
            this._running = false;
        },

        _hold : function () {
            this._blocks++;
        },

        _release : function () {
            this._blocks--;
            // resume, asynchronously
            setTimeout(this._bind( function () {
                this._resume();
            }), 0);
        },

        _eval : function (message, code, scope, args){
            if( this.options.exceptions ) {
                code && code.apply(scope, args);
                this.report(message);
                return;
            }

            var error;
            try {
                code && code.apply(scope, args);
            }
            catch(e){
                error = "Exception: " + e;
            }
            this.report(message, error);
        },

        _resume : function () {
            if( ! this._running ) {
                return;
            }

            // waiting for some async
            if( this._blocks ) {
                return;
            }
            // no more tests, we're done
            if( ! this._queue.length ){
                this._finish();
                return;
            }

            // onto the next test
            this._subtests = [];
            var test = this._queue.shift();
            this._expectErrors =  test.expectErrors;
            this.logger.onTest( test );

            this._hold();

            if( test.code )
                this._eval(test.message, test.code);

            if( test.url )
                this._url(test.url);

            this._release();

            // queue up any subtests generated during run
            this._queue = this._subtests.concat( this._queue);
        },

        _url : function (url){
            this._hold();
            var el = _okframe(true);
            el.src = url;
            el.__OK_PARENT__ = this;
            this.logger.onInfo({
                url: url
            });
        },

        _remote : function (unit) {
            if( ! this._running )
                return;
            this.logger.onRemote(unit);
            this.passed += unit.passed;
            this.failed += unit.failed;
            this._release();
        },

        _finish : function () {
            this._running = false;

            if( this._parent )
                this._parent._remote(this);

            var el = _el("okframe");
            if( el ){
//                el.src = "about:blank";
//                el.style.display = "none"
            }
            this.logger.onFinish();
        },

        // utility: scope binding to this object
        _bind : function ( callback ) {
            var self = this;
            return function (){
                callback.apply(self, arguments);
            }
        }

    };

    /**
     *  Default Logger
     */
    var DefaultLogger = function ( okjs ) {

        if( !(this instanceof DefaultLogger) )
            return new DefaultLogger( okjs );

        defaultCSS();
        this.unit = okjs;
        this.unit.logger = this;

        this._started = now();

        // set up output div
        this.output = _el('output');

        if( ! this.output ) {
            this.output = document.createElement('div');
            this.output.setAttribute('id', 'output');
            var body = document.getElementsByTagName('body')[0];
            body.appendChild(this.output);
        }

    };

    DefaultLogger.prototype = {
        _log : function (type, message) {
            this.output.appendChild( div( "item " + type,
                this._timestamp(), '::', type, "::", message
            ));
            this._scroll();
        },

        _scroll : function (){
            var large = Math.pow(2, 30);
            try {
                window.scrollY = window.pageYOffset =  large;
            }
            catch(e) {}
            window.scroll && window.scroll(0, large); // crx
        },

        _timestamp : function () {
            return ( this.unit.time() / 1000 ) + 's';
        },

        _summary : function () {

            var type = "summary";
            if( this.unit.failed )
                type += " error";
            else if( this.unit.skipped )
                type += " skip";
            else
                type += " success";

            this.output.appendChild(div( type,
                this.unit.passed + " test" + (this.unit.passed == 1 ? '' : 's') + " completed. "
                    +  (this.unit.skipped ? this.unit.skipped + " groups skipped. " : '')
                    + this.unit.failed + " error" +(this.unit.failed == 1 ? '' : 's')+ ". "
                    + this._timestamp()
            ));
        },

        onTest : function ( group ) {
            this.output.appendChild( div("group", group.message ));
            this._scroll();
        },

        onSuccess : function (result) {
            this._log("ok", result.message);
        },

        onFail : function (result) {
            this._log("fail", result.message + ". " + result.error);
        },

        onInfo : function ( info ) {
            this._log("info", link( info.url, info.message) );
        },

        onSkip : function ( info ) {
            this._log("skip",  info.message);
        },

        onRemote : function (unit) {
            this._log(
                unit.failed ? 'fail' : 'ok',
                unit.passed + " test" + (unit.passed == 1 ? '' : 's') + " completed. "
                    +  (unit.skipped ? unit.skipped + " skipped. " : '')
                    + unit.failed + " error" +(unit.failed == 1 ? '' : 's')+ ". "
                    + this._timestamp()
            );
        },

        onFinish : function ( unit ) {
            this.output.appendChild( div("summary", "Test Complete") );
            this._summary();
            this._scroll();
        }
    };

    /*
     * Utilities
     */

    function defaultCSS () {
        var css = [
            ".error, .fail { color: red; }",
            ".success, .ok{ color: gray; }",
            ".test, .group, .summary { font-weight: bold; font-size: 1.1em; }",
            ".info { font-weight: bolder; color: gray; }",
            ".skip { color: purple; }",
            ".prompt { font-weight: bolder; color: green; }",
            ".summary { margin-top: 10px; } ",
            ".summary.success { color: green; }",
            ".item { margin-left: 15px; font-family: monospace;}",
            "#okframe { background: white; z-index: 100; border: 5px solid gray; border-radius: 5px; position: absolute; top: 10px; bottom: 10px; right: 15px; width: 50%; height: 95%; }"
        ];
        var ss = document.createElement("style");
        ss.text = ss.innerHTML = css.join("\n");
        var head = document.getElementsByTagName('head')[0];
        head.insertBefore(ss, head.children[0] );
    }

    function _el ( id ) {
        return document.getElementById(id);
    }

    function _okframe ( create ) {
        var id = "okframe";
        var el = _el(id);
        if( ! el && create) {
            el = document.createElement("iframe");
            el.setAttribute('id', id);
            var body = document.getElementsByTagName('body')[0];
            body.appendChild(el);
        }
        return el;
    }

    function div ( className, message1, message2, etc ) {
        var el = document.createElement('div');

        if( className )
            el.setAttribute('class', className);

        for(var i = 1; i < arguments.length; i++) {

            if( typeof arguments[i] == "string")
                el.appendChild( document.createTextNode(arguments[i]) );
            else
                el.appendChild(  arguments[i] );

            el.appendChild( document.createTextNode(' ') );
        }

        return el;
    }

    function link (href, message, target ) {
        var el;

        message = message || href || '';

        if( href ) {
            el = document.createElement('a');
            el.setAttribute('href', href);
            el.setAttribute('target', target || '_blank');
            el.appendChild( document.createTextNode(message) );
        }
        else
            el = document.createTextNode(message);

        return el;
    }

    function now () {
        return ( new Date() ).getTime();
    }

    function merge (a, b) {
        var k, c = {};
        for( k in a ) {
            if( a.hasOwnProperty(k) )
                c[k] = a[k];
        }
        for( k in b ) {
            if( b.hasOwnProperty(k) )
                c[k] = b[k];
        }
        return c;
    }

    function compare (got, expected) {
        if( expected instanceof Function ){
            expected = expected.call(null, got);
        }

        if( expected instanceof Array || expected instanceof Object ) {
            if( expected.equals instanceof Function ){
                return expected.equals(got);
            }
            else {
                // poor man's deep compare: use JSON to compare objects
                var e, g;
                try {
                    e = JSON.stringify(expected);
                    g = JSON.stringify(got);
                    return e === g;
                }
                catch(e) {
                    return (expected === got);
                }
            }
        }
        else {
            return(expected === got);
        }
    }

})();