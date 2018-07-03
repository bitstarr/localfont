/* global basePath:false */
(function(){
    'use strict';

    /*
        Storing fonts in localSortage to avoid FOUT and rise performance.
        @see http://bdadam.com/blog/loading-webfonts-with-high-performance.html
        @see http://crocodillon.com/blog/non-blocking-web-fonts-using-localstorage
        @see https://www.filamentgroup.com/lab/font-loading.html
        @see https://github.com/filamentgroup/woff2-feature-test
     */

    /* Only start if the browser can use localStorage */
    if ( window.navigator.cookieEnabled && typeof window.localStorage === 'object' ) {
        //var ua = window.navigator.userAgent;
        var fontFile = {
                'woff2': 'dist/css/woff2.css',
                'woff': 'dist/css/woff.css',
            },
            format = 'woff',
            version = window.fontHash;

        // Use WOFF2 if supported
        if ( supportsWoff2 ) {
            format = 'woff2';
        }


        var lsf = {
            // Get the font from LS
            addFont: function() {
                var style = document.createElement( 'style' );
                style.rel = 'stylesheet';
                document.head.appendChild( style );
                style.textContent = localStorage.webfont;
            },
            // Set the font in LS
            getFont: function() {
                var _self = this,
                    request = new XMLHttpRequest();

                request.open( 'GET', basePath + fontFile[format], true );

                request.onload = function() {
                    if ( request.status >= 200 && request.status < 400 ) {
                        // We save the file in localStorage
                        localStorage.webfont = request.responseText;
                        localStorage.webfontVersion = version;

                        // ... and load the font
                        _self.addFont();
                    }
                };

                request.send();
            }
        };

        // get or set?
        try {
            if ( localStorage.webfont && localStorage.webfontVersion === version ) {
                // The font is in localStorage, the version is the same, we can load it directly
                lsf.addFont();
            } else {
                // We have to first load the font file asynchronously
                lsf.getFont();
            }
        } catch( ex ) {
            // maybe load the font synchronously for woff-capable browsers
            // to avoid blinking on every request when localStorage is not available

            /*
            if( ex.name == 'NS_ERROR_FILE_CORRUPTED' ) {
                console.log( "Sorry, it looks like your browser storage has been corrupted. Please clear your storage by going to Tools -> Clear Recent History -> Cookies and set time range to 'Everything'. This will remove the corrupted browser storage across all sites." );
            */
        }

    }

}());
