#CSV-JS 
A Comma-Separated Values parser for JS

-----

Built to the <a href="http://www.ietf.org/rfc/rfc4180.txt">rfc4180</a> standard, with adjustable strictness:

- optional carriage returns for non-microsoft sources 
- automatically type-cast numeric an boolean values
- An optional "relaxed" mode which: 
 - ignores blank lines
 - ignores garbage following quoted tokens
 - does not enforce a consistent record length

Live example:
<iframe style="width: 600px; height: 300px; margin: 10px; border: 1px solid #000;" src="http://jsfiddle.net/gkindel/K6kda/embedded/result" frameborder="0"></iframe>

Use:
----
Simple:

        var rows = CSV.parse("one,two,three\4,5,6")
        // rows equals [["one","two","three"],[4,5,6]]

jQuery AJAX suggestion:

    $.get("csv.txt")
        .pipe( CSV.parse )
        .done( function(rows) {
           for( var i =0; i < rows.length; i++){
               console.log(rows[i])
           }
     });

Options:
----

CSV.RELAXED

> Enables a "relaxed" strictness mode. Default: `false`

- Ignores blank lines;
- Ignores garbage characters following a close quote
- Ignores inconsistent records lengths
     
CSV.IGNORE\_RECORD\_LENGTH

> If relaxed mode is not already enabled, ignores inconsistent records lengths Default: `false`

CSV.IGNORE\_QUOTES

> Treats all values as literal, including surrounding quotes. For use if CSV isn't well formatted. This will disable escape sequences. Default: `false`

CSV.LINE\_FEED\_OK

> Suppress exception for missing carriage returns (specification requires CRLF line endings). Default: `true`

CSV.DETECT\_TYPES

> Automatically type-cast numeric an boolean values such as "false", "null", and "0.1", but not "abcd", "Null", or ".1".  Customizable by overriding CSV.resolve_type(str) which returns value.  Default: `true`

CSV.DEBUG

> Enables debug logging to console.  Default: `false`

Exceptions Thrown:
----

*"UNEXPECTED\_END\_OF\_FILE"* or `CSV.ERROR_EOF`

> Fired when file ends unexpectedly. Eg. File ends during an open escape sequence. Example:

>`Uncaught UNEXPECTED_END_OF_FILE at char 72 : ption,Price\n1997,Ford,E350,"ac, abs, moon,3000.00`

*"UNEXPECTED_CHARACTER"*  or `CSV.ERROR_CHAR`

> Fired when an invalid character is detected. Eg. A non-comma after the close of an quoted value. Example:

>   `Uncaught UNEXPECTED_CHARACTER at char 250 : rand Cherokee,"MUST SELL!\nair, moon roof, loaded"z`


*"UNEXPECTED_END_OF_RECORD"* or `CSV.ERROR_EOL`

> Fired when a record ends before the expected number of fields is read (as determined by first row). Example:

> `Uncaught UNEXPECTED_END_OF_RECORD at char 65 : ,Description,Price\n1997,Ford,E350,"ac, abs, moon"\n `

License:
----
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

Author:
---- 
Greg Kindel (twitter <a href="http://twitter.com/gkindel">@gkindel</a>), 2013
