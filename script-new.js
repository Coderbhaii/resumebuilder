class ResumePagesManager {
    // Config
    DEFAULT_PAGES = 3;
    SINGLE_PAGE_HEIGHT = 297; // MM (A4 height)
    SINGLE_PAGE_WIDTH = 210; // MM (A4 width)

    // Layers
    $con = $('.cv-container');
    $pagesLayer = $('.pages-layer');
    $contentLayer = $('.content-layer');
    $pageBreakLayer = $('.break-points-layer');

    constructor() {
        this.makePages();
        this.implementLogic();
        this.monitorPages();
        this.setupChangeDetection();
        this.setupExportPDF();
    }

    makePages() {
        let height = this.SINGLE_PAGE_HEIGHT * this.DEFAULT_PAGES;
        this.$pagesLayer.css("height", `${height}mm`);
        this.$pageBreakLayer.css("height", `${height}mm`);
        this.$con.css("width", `${this.SINGLE_PAGE_WIDTH}mm`);
    }

    addDottedLine(pos) {
        let el = document.createElement('div');
        el.classList.add('page-break');
        el.style.width = '100%';
        el.style.borderTop = '1px dashed #000';
        el.style.position = 'absolute';
        el.style.top = `${pos}mm`;
        el.style.left = '0';
        this.$pageBreakLayer.append($(el));
    }

    implementLogic() {
        this.$pageBreakLayer.html("");
        $('.empty-div').remove();

        let posY = this.SINGLE_PAGE_HEIGHT;
        for (let i = 1; i < this.DEFAULT_PAGES; i++) {
            this.addDottedLine(posY);
            posY += this.SINGLE_PAGE_HEIGHT;
        }

        this.adjustContentForPageBreaks();
    }

    adjustContentForPageBreaks() {
        $('.page-break').each((index, pageBreak) => {
            let pageBreakTop = pageBreak.offsetTop;
            let elements = this.$contentLayer.find('*');

            elements.each((_, element) => {
                let $element = $(element);
                let elementBottom = $element.offset().top + $element.outerHeight() - this.$con.offset().top;

                if (elementBottom > pageBreakTop && elementBottom < (pageBreakTop + 20)) {
                    $element.css('margin-bottom', `${pageBreakTop + 20 - elementBottom}px`);
                }
            });
        });
    }

    monitorPages() {
        this.implementLogic();
        let contentLayerH = this.$contentLayer.get(0).offsetHeight;
        let count = Math.ceil(contentLayerH / (this.SINGLE_PAGE_HEIGHT * 3.7795275591)); // Convert mm to px

        if (count !== this.DEFAULT_PAGES) {
            this.DEFAULT_PAGES = count;
            this.makePages();
        }
    }

    setupChangeDetection() {
        const observer = new MutationObserver(() => {
            this.implementLogic();
            this.monitorPages();
        });

        observer.observe(this.$contentLayer[0], {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true
        });
    }

    setupExportPDF() {
        $('#exportPDF').on('click', () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');

            // Hide the export button and page breaks for PDF generation
            $('#exportPDF').hide();
            $('.page-break').hide();

            let currentPage = 1;
            const pageHeight = doc.internal.pageSize.height;

            const addPage = (dataUrl) => {
                if (currentPage > 1) {
                    doc.addPage();
                }
                doc.addImage(dataUrl, 'JPEG', 0, 0, this.SINGLE_PAGE_WIDTH, this.SINGLE_PAGE_HEIGHT);
                currentPage++;
            };

            const processPage = (pageNum) => {
                return new Promise((resolve) => {
                    const pageElement = this.$con[0];
                    const options = {
                        scale: 2,
                        useCORS: true,
                        scrollY: -pageNum * this.SINGLE_PAGE_HEIGHT,
                        windowWidth: this.SINGLE_PAGE_WIDTH,
                        windowHeight: this.SINGLE_PAGE_HEIGHT
                    };

                    html2canvas(pageElement, options).then((canvas) => {
                        addPage(canvas.toDataURL('image/jpeg', 1.0));
                        resolve();
                    });
                });
            };

            const generatePDF = async () => {
                for (let i = 0; i < this.DEFAULT_PAGES; i++) {
                    await processPage(i);
                }
                doc.save('resume.pdf');

                // Show the export button and page breaks again
                $('#exportPDF').show();
                $('.page-break').show();
            };

            generatePDF();
        });
    }
}

// Initialize the ResumePagesManager
$(document).ready(() => {
    new ResumePagesManager();
});