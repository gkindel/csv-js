exports.run = function(args) {
    var csv = require('../csv'),
        fs = require('fs'),
        target = args[0],
        contents, rows
        ;

    try {
        if(target == null || !fs.statSync(target).isFile()) {
            console.log(
                "Usage: csv-js-linter file.csv" +
                "\n will exit with status 0 if everything is fine"
            );
            process.exit(1)
        }
        contents = fs.readFileSync(target);
        rows = csv.parse(contents.toString());
        process.exit(0)
    }catch (e) {
        console.dir(e);
        process.exit(1);
    }

}