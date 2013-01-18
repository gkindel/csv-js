#CSV-JS 
A Comma-Separated Values parser for JS

-----

Built to rfc4180 standard, with options for adjusting strictness:

- optional carriage returns for non-microsoft sources (default: on)
 - automatically type-cast numeric an boolean values (default: on)
- An optional "relaxed" mode (default: off ) which: 
 - ignores blank lines
 - ignores gargabe following quoted tokens
 - does not enforce a consistent record length

Use
---
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


License 
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

Author 
---- 
Greg Kindel (twitter <a href="http://twitter.com/gkindel">@gkindel</a>), 2013
