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

        // Bind methods (so we can easily remove event listeners if needed)
        this.bindMethods()

        // Events listeners
        this.events()

    }

    requirements() {

        let allow = true;

        // Check if it's admin
        if (document.body.classList.contains('wp-admin')) {
            allow = false;
        }

        // Check if all libs are loaded
        this.libs.forEach(lib => {
            if (typeof window[ lib ] == 'undefined') {
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
        if (!window?.DCA?.breakpoints) {
            const htmlStyle = getComputedStyle(document.documentElement);
            window.DCA.breakpoints = {
                sm: htmlStyle.getPropertyValue('--pip-screen-sm').replace('px', '') || 640,
                md: htmlStyle.getPropertyValue('--pip-screen-md').replace('px', '') || 768,
                lg: htmlStyle.getPropertyValue('--pip-screen-lg').replace('px', '') || 1024,
                xl: htmlStyle.getPropertyValue('--pip-screen-xl').replace('px', '') || 1280
            }
        }
        this.breakpoints = window?.DCA?.breakpoints;
        this.isMobile = window.innerWidth < this.breakpoints.md;
        this.isDesktop = window.innerWidth > this.breakpoints.lg;
        this.isTablet = window.innerWidth > this.breakpoints.md && window.innerWidth < this.breakpoints.lg;

        // Debug modes
        this.isDebug = window.location.search.includes('debug') && !window.location.search.includes('debughard'); // Add "?debug" in the url to get logs
        this.isDebugHard = window.location.search.includes('debughard'); // Add "?debug" in the url to get logs

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
            window.getMousePos = e => { return { x: e.clientX, y: e.clientY } };
        }
        // Gets distance between 2 coords
        if (!window?.distance) {
            window.distance = (x1, y1, x2, y2) => { return Math.hypot(x1 - x2, y1 - y2); }
        }
        // Generate a random float.
        if (!window?.getRandomFloat) {
            window.getRandomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
        }

        // Load a script async as a promise
        // ex: loadScript("https://www.youtube.com/iframe_api").then( data => { ... } )
        // @source : https://abdessalam.dev/blog/loading-script-asynchronously-as-a-promise-in-javascript/
        if (!window?.loadScript) {
            window.loadScript = (src, async = true, type = "text/javascript") => {
                return new Promise((resolve, reject) => {
                    try {
                        const tag = document.createElement("script");
                        const container = document.head || document.body;

                        tag.type = type;
                        tag.async = async;
                        tag.src = src;

                        tag.addEventListener("load", () => {
                            resolve({ loaded: true, error: false });
                        });

                        tag.addEventListener("error", () => {
                            reject({
                                loaded: false,
                                error: true,
                                message: `Failed to load script with src ${src}`,
                            });
                        });

                        container.appendChild(tag);
                    } catch (error) {
                        reject(error);
                    }
                });
            };
        }

    }

    setModules() {

        const instance = this;

        // Global intersection observer
        if ( !window?.DCA?.observer ) {
            const observer = new IntersectionObserver(entries => {
                for (const entry of entries) {

                    const el = entry.target;
                    const elTextContent = el.textContent.trim().replace(/\n|\r/g, '').substring(0, 24);
                    const elInstance = el?.instance;

                    if (entry.isIntersecting) {

                        el.visible = true;
                        elInstance.isVisible(el)
                        elInstance.log(`<${el.localName}> "${elTextContent}..." is in viewport 👀`, el)

                        // Send event
                        el.dispatchEvent(new Event('is_visible'));

                    } else {

                        el.visible = false;
                        elInstance.isNotVisible(el)
                        elInstance.log(`<${el.localName}> "${elTextContent}..." is not in viewport 🙈`, el)

                        // Send event
                        el.dispatchEvent(new Event('is_not_visible'));

                    }
                }
            },
                // Options playground: https://wilsotobianco.com/experiments/intersection-observer-playground/#down
                {
                    rootMargin: '-100px 0px -100px 0px',
                    // trackVisibility: true,
                    // 🆕 =====ANSWER=====: Set a minimum delay between notifications
                    // delay: 100
                }
            )
            window.DCA.observer = observer;
        }

        // Debug modules
        if ( this.isDebug || this.isDebugHard ) {

            // Outline debugger
            if ( !document.getElementById('outline-debugger') ) {

                const style = document.createElement('style');
                style.id = 'outline-debugger';
                style.innerHTML = '*, :after, :before { outline: calc(var(--debug)*1px) dotted red; }';
                document.body.appendChild(style);

            }

            // Debug GUI
            if ( !window?.DCA?.gui ) {

                // To stop immediatly this code while scripts are loading
                window.DCA.gui = true;

                // Get Tweakpane lib in DOM
                loadScript('https://cdn.jsdelivr.net/npm/tweakpane@3.1.9/dist/tweakpane.min.js').then( data => {

                    // Get Tweakpane Essentials plugin lib
                    loadScript('https://cdn.jsdelivr.net/npm/@tweakpane/plugin-essentials@0.1.8/dist/tweakpane-plugin-essentials.min.js').then( data => {

                        // Init GUI
                        const GUI = new Tweakpane.Pane({
                            title: 'DEBUG',
                        });

                        // Use Essentials plugin
                        GUI.registerPlugin(TweakpaneEssentialsPlugin);

                        // Add FPS monitoring
                        const fpsGraph = GUI.addBlade({
                            view: "fpsgraph",
                            label: "FPS",
                            lineCount: 2
                        })
                        function render() {
                            fpsGraph.begin();

                            // Rendering

                            fpsGraph.end();
                            requestAnimationFrame(render);
                        }
                        render();

                        // Update GUI pos & style
                        if ( GUI?.containerElem_ ) {
                            GUI.containerElem_.style = 'position: fixed; top: auto; right: 1rem; bottom: 3rem; z-index: 99999;';
                        }

                        instance.log('Debug - Tweakpane loaded 🔥');

                        // Store correct GUI instance
                        window.DCA.gui = GUI;

                    })
                })

            }

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
    onInit() { }

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

    // Important to do this so we can easily remove event listeners if needed
    bindMethods() {
        this._ready = this._ready.bind(this)
        this._load = this._load.bind(this)
        this.onReady = this.onReady.bind(this)
        this.onLoad = this.onLoad.bind(this)
        this.onResize = throttle(this.onResize.bind(this), 100)
        this.onScroll = throttle(this.onScroll.bind(this), 50)
    }

    events() {

        // Internal events
        this._init()
        window.addEventListener('DOMContentLoaded', this._ready)
        window.addEventListener('load', this._load)

        // Events
        this.onInit()
        window.addEventListener('DOMContentLoaded', this.onReady)
        window.addEventListener('load', this.onLoad)
        window.addEventListener('resize', this.onResize)
        document.addEventListener('scroll', this.onScroll, {
            capture: true, // for perfs
            passive: true // for perfs
        })

    }

    _init() { }

    _ready() {

        // Auto-observe elements in "observedEls" property
        this.observedEls.forEach(el => {
            this.observe(el);
        })

        // Replace all DOM links with appended "?debug"
        if ( !window?.DCA?.debugLinks ) {
            window.DCA.debugLinks = true;
            const debugString = window.location.search.includes('debughard') ? 'debughard' : 'debug';
            for ( let a of document.querySelectorAll('a') ) {
                a.href +=
                    (a.href.match(/\?/) ? '&' : '?') +
                    debugString;
            }
        }

    }

    _load() { }

}
