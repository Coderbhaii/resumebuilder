import wkhtmltopdf from "wkhtmltopdf";
import fs from 'fs';
wkhtmltopdf('http://localhost/page-break/index.html', { pageSize: 'a4' })
    .pipe(fs.createWriteStream('out.pdf'));