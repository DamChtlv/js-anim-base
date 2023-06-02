// Global object to store instances / data
window.DCA = {}

// Anim class which will be extended
class DC_AnimBase {
    constructor(slug) {

        this.moduleSlug = slug;

        // Breakpoints...
        this.setProperties();

        // Requirements before running
        if (!this.requirements()) {
            return;
        }

        // Setup
        this.setup()

        // Internal events
        this._init()
        window.addEventListener('DOMContentLoaded', this._ready.bind(this) )
        window.addEventListener('load', this._load.bind(this) )

        // Binded events (used by extended classes)
        this.onInit()
        window.addEventListener('DOMContentLoaded', this.onReady.bind(this))
        window.addEventListener('load', this.onLoad.bind(this))
        window.addEventListener('resize', throttle(this.onResize.bind(this), 100))
        document.addEventListener('scroll', debounce(this.onScroll.bind(this), 100), {
            capture: true, // for perfs
            passive: true // for perfs
        })

    }

    requirements() {

        let allow = true;

        // Check if it's admin
        if (document.body.classList.contains('wp-admin')) {
            allow = false;
        }

        // Check if all libs are loaded
        this.libs.forEach( lib => {
            if (typeof window[lib] == 'undefined') {
                this.errorLog(`"${this.moduleSlug}" need "${lib}" library which is not loaded.`);
                allow = false;
            }
        });

        return allow
    }

    setProperties() {

        // Properties
        this.libs = []; // External JavaScript libraries
        this.observedEls = [];
        this.breakpoints = {
            sm: getComputedStyle(document.documentElement).getPropertyValue('--pip-screen-sm').replace('px', '') || 640,
            md: getComputedStyle(document.documentElement).getPropertyValue('--pip-screen-md').replace('px', '') || 768,
            lg: getComputedStyle(document.documentElement).getPropertyValue('--pip-screen-lg').replace('px', '') || 1024,
            xl: getComputedStyle(document.documentElement).getPropertyValue('--pip-screen-xl').replace('px', '') || 1280
        }
        this.isMobile = window.innerWidth < this.breakpoints.md;
        this.isDesktop = window.innerWidth > this.breakpoints.lg;
        this.isTablet = window.innerWidth > this.breakpoints.md && window.innerWidth < this.breakpoints.lg;

        // Debug modes
        this.isDebug = window.location.search.includes('debug') && !window.location.search.includes('debughard'); // Add "?debug" in the url to get logs
        this.isDebugHard = window.location.search.includes('debughard'); // Add "?debug" in the url to get logs

        // Selectors
        this.header = document.querySelector('header');
        this.sections = Array.from(document.querySelectorAll('section'));

    }

    setHelpers() {

        // Get jQuery object and store it in global for further use like: $(...)
        if (window?.jQuery && !window?.$) {
            window.$ = window.jQuery;
        }

        // Anim helpers
        if (!window?.lerp) {
            window.lerp = (start, end, amt) => { return (1 - amt) * start + amt * end };
        }
        if (!window?.debounce) {
            window.debounce = (callback, delay) => { var timer; return function () { var args = arguments; var context = this; clearTimeout(timer); timer = setTimeout(function () { callback.apply(context, args); }, delay) } }
        }
        if (!window?.throttle) {
            window.throttle = (callback, delay) => { var last; var timer; return function () { var context = this; var now = +new Date(); var args = arguments; if (last && now < last + delay) { clearTimeout(timer); timer = setTimeout(function () { last = now; callback.apply(context, args); }, delay); } else { last = now; callback.apply(context, args); } }; }
        }
        // Gets window size
        if (!window?.calcWinsize) {
            window.calcWinsize = () => { return { width: window.innerWidth, height: window.innerHeight } };
        }
        // Gets the mouse position
        if (!window?.getMousePos) {
            window.getMousePos = e => { return { x: e.clientX,  y: e.clientY } };
        }
        // Gets distance between 2 coords
        if (!window?.distance) {
            window.distance = (x1,y1,x2,y2) => { return Math.hypot(x1 - x2, y1 - y2); }
        }
        // Generate a random float.
        if (!window?.getRandomFloat) {
            window.getRandomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
        }

    }

    setModules() {

        // Global intersection observer
        if ( !window?.DCA?.observer ) {
            const observer = new IntersectionObserver( entries => {
                for (const entry of entries) {

                    const el = entry.target;
                    const elTextContent = el.textContent.trim().replace(/\n|\r/g, '').substring(0, 24);
                    const elInstance = el?.instance;

                    // console.log(entry.intersectionRatio);

                    if (entry.isIntersecting) {
                        elInstance.isVisible(el)
                        elInstance.log(`<${el.localName}> "${elTextContent}..." is in viewport 👀`, el)
                    } else {
                        elInstance.isNotVisible(el)
                        elInstance.log(`<${el.localName}> "${elTextContent}..." is not in viewport 🙈`, el)
                    }
                }
            },
                // Options playground: https://wilsotobianco.com/experiments/intersection-observer-playground/#down
                { rootMargin: '-100px 0px -100px 0px' }
            )
            window.DCA.observer = observer;
        }

    }

    // 0. Set stuff before executing events functions
    setup() {

        // Anim helpers (debounce, throttle, lerp...)
        this.setHelpers();

        // Intersection Observer...
        this.setModules();

        // Set module class
        document.documentElement.classList.add('dc-' + this.moduleSlug + '')

        this.log('is registered ✔', this);

    }

    // 1. Execute code as soon as possible
    onInit() {}

    // 2. Execute code when DOM is ready
    onReady() { }

    // 3. Execute code when DOM is totally loaded
    onLoad(ev) { }

    // 4. Execute code when window is resized
    onResize(ev) { }

    // 5. Execute code when scrolled
    onScroll(ev) { }

    // 6. Execute code when an element enter the viewport
    isVisible(el) { }

    // 7. Execute code when an element leave the viewport
    isNotVisible(el) { }

    // Fancy debug log related to the current layout
    log() {

        // Log style
        const output = this.isDebug || this.isDebugHard && arguments.length === 1 ? arguments[ 0 ] : (this.isDebugHard ? [ ...arguments ] : '');
        const style = 'font-weight: bold; background: #ff8066; color: #252525; padding: .1em .3em;';
        const style2 = 'font-weight: bold; color: #0DE4DB;';

        // Debug only for specific layout using layout slug as value for ?debug query string (ex: ?debug=your-layout)
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const debug = urlParams.get('debug');
        const debughard = urlParams.get('debughard');
        if (
            (debug && debug !== this.moduleSlug) ||
            (debughard && debughard !== this.moduleSlug)
        ) {
            return;
        }

        output && console.log(`%cANIM%c ${this.moduleSlug}`, style, style2, output);
    }

    // Fancy debug log related to the PIPLayout class
    globalLog() {
        const output = this.isDebug || this.isDebugHard && arguments.length === 1 ? arguments[ 0 ] : (this.isDebugHard ? [ ...arguments ] : '');
        const style = 'font-weight: bold; background: #2139e1; color: #fff; padding: .1em .3em;';
        output && console.log(`%cANIM%c ✨ `, style, '', output, ' ✨');
    }

    // Fancy error log related to the current layout
    errorLog() {
        const output = this.isDebug || this.isDebugHard && arguments.length === 1 ? arguments[ 0 ] : (this.isDebugHard ? [ ...arguments ] : '');
        output && console.error(`❌ ANIM:`, output);
    }

    observe(el) {

        // Store current instance on watched element to call it from outside the class
        el.instance = this;

        // Tell global observer to watch this element
        DCA.observer.observe(el);

        // Store it to compare it later with others els
        this.observedEls.push(el);

    }

    _init() { }

    _ready() {

        // Auto-observe elements in "observedEls" property
        this.observedEls.forEach(el => {
            this.observe(el);
        })

        // console.log(this.observedEls);

    }

    _load() { }

}
